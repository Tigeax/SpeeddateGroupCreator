document.getElementById("year").textContent = new Date().getFullYear();

// ── Toggle button ────────────────────────────────────────────
document.getElementById("full-coverage").addEventListener("click", () => {
  state = document.getElementById("full-coverage").checked === true;
  document.getElementById("rounds-label").hidden = state;
});

// ── Render ───────────────────────────────────────────────────
let lastResult = null;

document.getElementById("generate-btn").addEventListener("click", () => {
  const rawNames = document
    .getElementById("names-input")
    .value.trim()
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (rawNames.length < 2) {
    alert("Please enter at least 2 participants.");
    return;
  }

  const groupSize = parseInt(document.getElementById("group-size").value, 10);
  if (isNaN(groupSize) || groupSize < 2) {
    alert("Group size must be at least 2.");
    return;
  }

  const fullCoverage =
    document.getElementById("full-coverage").checked === true;
  const distribute = document.getElementById("distribute").checked === true;
  const numRounds = fullCoverage
    ? null
    : parseInt(document.getElementById("num-rounds").value, 10);

  setTimeout(() => {
    const result = generateSchedule(rawNames, groupSize, distribute, numRounds);
    lastResult = { result, names: rawNames };
    renderResults(rawNames, result);
    document.getElementById("empty-state").hidden = true;
    document.getElementById("statistics").hidden = false;
    document.getElementById("schedule").hidden = false;
    document.getElementById("coverage").hidden = false;
    document.getElementById("export").hidden = false;
  }, 10);
});

function renderResults(names, { schedule, meetCounts }) {
  const scores = computeSeenScores(meetCounts);
  const avgCoverage = scores.reduce((a, b) => a + b, 0) / scores.length;

  document.getElementById("stats-participants").innerHTML = `${names.length}`;
  document.getElementById("stats-rounds").innerHTML = `${schedule.length}`;
  document.getElementById("stats-coverage").innerHTML =
    `${(avgCoverage * 100).toFixed(0)}%`;

  const tbody = document.querySelector("#coverage-table tbody");
  tbody.innerHTML = scores
    .map((s, i) => {
      const met = Math.round(s * (names.length - 1));
      const pct = (s * 100).toFixed(0);
      return `<tr>
          <td>${names[i]}</td>
          <td>${met} / ${names.length - 1}</td>
          <td><progress value="${pct}" max="100"></progress> ${pct}%</td>
        </tr>`;
    })
    .join("");

  document.getElementById("schedule-output").innerHTML = schedule
    .map((round, ri) => {
      const groupsHtml = round
        .map(
          (group, gi) =>
            `<li><strong>Group ${gi + 1}:</strong> ${group.map((i) => names[i]).join(", ")}</li>`,
        )
        .join("");
      return `<details open><summary><strong>Round ${ri + 1}</strong></summary><ul>${groupsHtml}</ul></details>`;
    })
    .join("");
}

/** Per-person fraction of others they've met (0–1) */
function computeSeenScores(meetCounts) {
  const n = meetCounts.length;
  return meetCounts.map((row, i) => {
    const met = row.filter((v, j) => j !== i && v > 0).length;
    return n > 1 ? met / (n - 1) : 1;
  });
}

// ── Export helpers ───────────────────────────────────────────
function scheduleToText(names, schedule) {
  return schedule
    .map(
      (round, ri) =>
        `Round ${ri + 1}\n` +
        round
          .map(
            (g, gi) =>
              `  Group ${gi + 1}: ${g.map((i) => names[i]).join(", ")}`,
          )
          .join("\n"),
    )
    .join("\n\n");
}

function scheduleToJSON(names, schedule) {
  return JSON.stringify(
    schedule.map((round, ri) => ({
      round: ri + 1,
      groups: round.map((g, gi) => ({
        group: gi + 1,
        members: g.map((i) => names[i]),
      })),
    })),
    null,
    2,
  );
}

function scheduleToCSV(names, schedule) {
  const rows = [["Round", "Group", "Members"]];
  schedule.forEach((round, ri) => {
    round.forEach((g, gi) => {
      rows.push([ri + 1, gi + 1, g.map((i) => names[i]).join("; ")]);
    });
  });
  return rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
}

function download(content, filename, mime) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
}

document.getElementById("copy-btn").addEventListener("click", () => {
  if (!lastResult) return;
  navigator.clipboard.writeText(
    scheduleToText(lastResult.names, lastResult.result.schedule),
  );
  const btn = document.getElementById("copy-btn");
  btn.textContent = "✓ Copied!";
  setTimeout(() => (btn.textContent = "Copy text"), 1500);
});

document.getElementById("export-txt-btn").addEventListener("click", () => {
  if (!lastResult) return;
  download(
    scheduleToText(lastResult.names, lastResult.result.schedule),
    "schedule.txt",
    "text/plain",
  );
});

document.getElementById("export-json-btn").addEventListener("click", () => {
  if (!lastResult) return;
  download(
    scheduleToJSON(lastResult.names, lastResult.result.schedule),
    "schedule.json",
    "application/json",
  );
});

document.getElementById("export-csv-btn").addEventListener("click", () => {
  if (!lastResult) return;
  download(
    scheduleToCSV(lastResult.names, lastResult.result.schedule),
    "schedule.csv",
    "text/csv",
  );
});
