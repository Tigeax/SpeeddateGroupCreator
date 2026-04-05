/** n×n zero-filled integer matrix */
function zeroMatrix(n) {
  return Array.from({ length: n }, () => new Array(n).fill(0));
}

/**
 * Greedy pick: from `available`, choose the candidate that has not met the most amount of participents
 * Ties broken are randomly.
 */
function pickBest(group, availableParticipants, meetCounts) {
  let bestScore = -Infinity;
  let best = [];

  // When group is empty, score against the full available pool
  // So a group starts off with a participent that has seen the least amount of others
  const scoreAgainst = group.length > 0 ? group : availableParticipants;

  for (let i = 0; i < availableParticipants.length; i++) {
    const candidate = availableParticipants[i];

    let score = 0;
    for (const groupMember of scoreAgainst) {
      if (candidate === groupMember) continue; // Don't score against themselves
      if (meetCounts[candidate][groupMember] === 0) score++;
    }

    if (score > bestScore) {
      bestScore = score;
      best = [i];
    } else if (score === bestScore) {
      best.push(i);
    }
  }

  // Break ties randomly
  return best[Math.floor(Math.random() * best.length)];
}

/**
 * Build one round.
 * @param {number}   participantsSize   total number of participants
 * @param {number[]}  groupSizes        number of members for each group
 * @param {number[][]} meetCounts       mutated in place
 */
function buildRound(numParticipants, groupSizes, meetCounts) {
  const available = Array.from({ length: numParticipants }, (_, i) => i);
  const round = [];

  for (const groupSize of groupSizes) {
    const group = [];
    while (group.length < groupSize && available.length > 0) {
      // Find best match to add to group
      const newGroupMemberidx = pickBest(group, available, meetCounts);
      group.push(available[newGroupMemberidx]);
      available.splice(newGroupMemberidx, 1);
    }

    // Add 1 meet count for every member that a member in a group meets
    for (const groupMember1 of group) {
      for (const groupMember2 of group) {
        if (groupMember1 === groupMember2) continue; // Skip themselves
        meetCounts[groupMember1][groupMember2]++;
      }
    }
    round.push(group);
  }

  return round;
}

/**
 * Determine group sizes.
 * @param {number}   numParticipants  total number of participants
 * @param {number}   groupSize        max group size
 * @param {boolean}  distribute       spread remainder into size+1 groups
 */
function calcGroupSizes(numParticipants, groupSize, distribute) {
  let sizes;
  const numGroups = Math.floor(numParticipants / groupSize);
  let leftover = numParticipants % groupSize;

  sizes = new Array(numGroups).fill(groupSize);

  if (distribute) {
    // Spread remainder into size+1 groups
    groupIdx = 0;
    while (leftover > 0) {
      sizes[groupIdx] = sizes[groupIdx] + 1;
      leftover--;
      groupIdx++;
      if (groupIdx === sizes.length) {
        groupIdx = 0;
      }
    }
  } else {
    // Strict max groupSize; last group gets remainder
    if (leftover > 0) sizes.push(leftover);
  }

  return sizes;
}

/** True if every distinct pair has met at least once */
function isFullyCovered(meetCounts) {
  const n = meetCounts.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue; // Skip themselves
      if (meetCounts[i][j] === 0) return false;
    }
  }
  return true;
}

function unmetPairs(meetCounts) {
  const n = meetCounts.length;
  let count = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (i === j) continue; // Skip themselves
      if (meetCounts[i][j] === 0) count++;
    }
  }
  return count;
}

/**
 * Generate schedule.
 * @param {string[]} names
 * @param {number}   groupSize
 * @param {boolean}  distribute     spread remainder into size+1 groups
 * @param {number|null} numRounds  — null = run until full coverage
 * @param {number} patience
 * Because round assignment is randomised, each full run produces a
 * different schedule. We keep re-running until `patience` consecutive
 * attempts fail to improve on the current best result, then return that
 * best. A higher patience value explores more of the solution space but
 * takes longer; lower values are faster but may miss better schedules.
 * In fixed-round mode (numRounds !== null) "better" means fewer unmet
 * pairs. In coverage mode (numRounds === null) "better" means the same
 * zero unmet pairs in fewer rounds.
 */
function generateSchedule(
  names,
  groupSize,
  distribute,
  numRounds,
  patience = 20,
) {
  const numParticipants = names.length;
  const groupSizes = calcGroupSizes(numParticipants, groupSize, distribute);
  const limit = numRounds !== null ? numRounds : 5000; // safety cap

  let stale = 0;
  let best = null;

  while (stale < patience) {
    const meetCounts = zeroMatrix(numParticipants);
    const schedule = [];

    // Build schedule
    // In coverage mode we stop early once every pair has met at least once.
    for (let r = 0; r < limit; r++) {
      const round = buildRound(numParticipants, groupSizes, meetCounts);
      schedule.push(round);
      if (numRounds === null && unmetPairs(meetCounts) === 0) break;
    }

    // Decide whether this run beats the current best.
    // Coverage mode: minimise round count — both candidates should have 0 unmet pairs, so shorter wins.
    // Fixed-round mode: minimise unmet pairs — round count is always exactly numRounds, so only coverage quality matters.
    const thisUnmet = unmetPairs(meetCounts);
    const bestUnmet = best ? unmetPairs(best.meetCounts) : Infinity;

    const moreParticipantsMet = thisUnmet < bestUnmet;
    const lessRounds =
      schedule.length < (best ? best.schedule.length : Infinity);

    const isBetter = moreParticipantsMet || lessRounds;

    if (best === null || isBetter) {
      best = { schedule, meetCounts };
      stale = 0; // improvement found — reset patience counter
    } else {
      stale++; // no improvement — move one step closer to giving up
    }
  }

  return { ...best };
}
