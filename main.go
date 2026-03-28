// Idea for differnt approach:
// Graph based, make graph based with edges if unseen
// Pick staring node (with most ednges)
// Select connected node (again with most edges?)
// Select next node (with most shared edges between the 2 already selected nodes)
// Repeat until group is full
// Seen array becomes a graph, Nodes have an in group status (reset every round)
// Could apply some kind of clustring algorithm to find groups of highly connected (thus not seen each other)
// Google: 'graph based clustering based on edges'
// (make sure algorithm can take into account number of groups (clusters) and max group size)

package main

import (
	"fmt"
	"math"
	"math/rand"
	"time"
)

func weightedChoice(weights []int) int {
	total := 0
	for _, w := range weights {
		total += w
	}
	
	if total == 0 {
		return rand.Intn(len(weights))
	}

	r := rand.Intn(total) // int in [0, total]
	for i, w := range weights {
		if r < w {
			return i
		}
		r -= w
	}

	return len(weights) -1 // fallback
}

func calcUnseenScore(group []int, seen []bool) int {
	sum := 0
	for _, memberIdx := range group {
		if !seen[memberIdx] {
			sum++
		}
	}
	return sum
}

func addGroupMember(group *[]int, members *[]int, seen [][]bool) {

	unseenScores := make([]int, len(*members))
	for i := range unseenScores {
		memberIdx := (*members)[i]
		if len(*group) == 0 {
			unseenScores[i] = calcUnseenScore(*members, seen[memberIdx]) // Highest score on who has seen the least amoutn of members not in any group yet
		} else {
			unseenScores[i] = calcUnseenScore(*group, seen[memberIdx]) // Highest score on who has seen the least amout in the current group
		}
	}
	
	// TODO experiment with picking the highest instead of weighed
	idx := weightedChoice(unseenScores)
	
	*group = append(*group, (*members)[idx])	
	*members = append((*members)[:idx], (*members)[idx+1:]...)

	for _, groupMember1 := range (*group) {
		for _, groupMember2 := range (*group) {
			seen[groupMember1][groupMember2] = true
		}
	}
}

func roundGroup(groupSize int, members *[]int, seen [][]bool) []int {

	group := make([]int, 0, groupSize)

	for range groupSize {
		if (len(*members) > 0) {
			addGroupMember(&group, members, seen)	
		}
	}	

	return group

}

func addRound(roundIdx int, groupSize int,  names []string, schedule [][][]int, seen [][]bool) {
	numGroups := int(math.Ceil(float64(len(names)) / float64(groupSize)))
	unusedMembers := make ([]int, len(names))
	for i := range len(names) {
		unusedMembers[i] = i
	}
	round := [][]int{}
	for range numGroups {
		group := roundGroup(groupSize, &unusedMembers, seen)
		round = append(round, group)
		fmt.Println(round)
	}	

}

func diagonalBoolMatrix(n int) [][]bool {
	m := make([][]bool, n)
	for i := range m {
		m[i] = make([]bool, n)
		m[i][i] = true
	}
	return m
}

func printSeenScores(seen [][]bool) {

	total := 0.0

	fmt.Println(seen)
	
	for _, s := range seen {
		sum := 0
		for _, v := range s {
			if v {
				sum++
			}
		}
		sum-- // remove seen self
		score := float64(sum)/float64(len(s)-1)
		total += score
		fmt.Println(score)
	}

	fmt.Println("-------------")
	averageScore := total/float64(len(seen))
	fmt.Println(averageScore)
	
}

func main() {
	fmt.Println("running")
	rand.Seed(time.Now().UnixNano())

	names := []string{
			"p1",
			"p2", 
			"p3", 
			"p4", 
			"p5", 
			"p6", 
			"p7", 
			"p8", 
			"p9", 
			"p10", 
			"p11", 
			"p12", 
			"p13", 
			"p14", 
			"p15", 
			"p16", 
			"p17", 
			"p18", 
			"p19", 
			"p20", 
			"p1",
			"p2", 
			"p3", 
			"p4", 
			"p5", 
			"p6", 
			"p7", 
			"p8", 
			"p9", 
			"p10", 
			"p11", 
			"p12", 
			"p13", 
			"p14", 
			"p15", 
			"p16", 
			"p17", 
			"p18", 
			"p19", 
			"p20", 
			"p1",
			"p2", 
			"p3", 
			"p4", 
			"p5", 
			"p6", 
			"p7", 
			"p8", 
			"p9", 
			"p10", 
			"p11", 
			"p12", 
			"p13", 
			"p14", 
			"p15", 
			"p16", 
			"p17", 
			"p18", 
			"p19", 
			"p20", 
			"p1",
			"p2", 
			"p3", 
			"p4", 
			"p5", 
			"p6", 
			"p7", 
			"p8", 
			"p9", 
			"p10", 
			"p11", 
			"p12", 
			"p13", 
			"p14", 
			"p15", 
			"p16", 
			"p17", 
			"p18", 
			"p19", 
			"p20", 
		}
	schedule := [][][]int{} 
	groupSize := 2
	rounds := 79

	seen := diagonalBoolMatrix(len(names))

	for i := range rounds {
		addRound(i, groupSize,  names, schedule, seen)
	}

	printSeenScores(seen)
}
