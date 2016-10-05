import {Clue, ClueSet, Grid, Cell} from './grid';

export class Solver {
  steps: any[]=[];

  constructor(private dictionary, private grid: Grid) {
  }

  getCompletionCandidates(clue) {
    var cands = this.dictionary.byLength[clue.cells.length - 1];
    if (!cands) return [];
    cands = cands.filter(cand => {
      var match = true;
      for (var j = 0; match && j < clue.cells.length; ++j) {
        var l = clue.cells[j].value;
        if (l && cand.word.charAt(j) !== l) match = false;
      }
      return match;
    })
    return cands;
  }

  getAutocompletion(clue, startVal='', endVal='') {
    var candidates = this.getCompletionCandidates(clue).map(c => c.word);
    if (!candidates.length) return;
    var idx = startVal ? candidates.indexOf(startVal) + 1 : Math.floor(Math.random() * candidates.length);
    return candidates[idx] === endVal ? null : candidates[idx];
  }

  autocomplete(clue, startVal='', endVal='') {
    var completion = this.getAutocompletion(clue, startVal, endVal);
    if (completion) {
      clue.cells.forEach((c, idx) => {
        if (!c.value) c.autocompleted = true;
        c.value = completion.charAt(idx);
      })
      clue.prompt = this.dictionary.clues[completion.toUpperCase()] || '';
    }
    return completion;
  }

  step() {
    var nextClue = this.getMostConstrainedClue();
    if (!nextClue) {
      this.fillPrompts();
      return true;
    }
    if (nextClue.isAutocompleted() && nextClue.isFull()) {
      return this.unwind() ? null : false;
    }
    var blanks = nextClue.cells.filter(c => !c.value);
    var completion = this.autocomplete(nextClue);
    if (completion) {
      var firstAttempt = nextClue.cells.map(c => c.value).join('');
      var lastAttempt = firstAttempt;
      this.steps.push({
        firstAttempt,
        lastAttempt,
        blanks,
        clue: nextClue,
      });
      return null;
    } else {
      return this.unwind() ? null : false;
    }
  }

  unwind(targetClues=null) {
    var lastStep = this.steps.pop();
    if (!lastStep) return;
    lastStep.blanks.filter(c => c.autocompleted).forEach(c => c.value = '');
    lastStep.clue.prompt = '';
    if (targetClues && targetClues.indexOf(lastStep.clue) === -1) {
      return this.unwind(targetClues);
    }
    var completion = this.autocomplete(lastStep.clue, lastStep.lastAttempt, lastStep.firstAttempt);
    if (completion) {
      lastStep.lastAttempt = completion;
      this.steps.push(lastStep);
      return true;
    } else {
      return this.unwind(targetClues);
    }
  }

  fillPrompts() {
    this.grid.clues.getClues().forEach(clue => {
      if (!clue.prompt && clue.isFull()) clue.prompt = this.dictionary.getPrompt(clue.getValue());
    })
  }

  getMostConstrainedClue() {
    var maxClue = null;
    var minCompletions = Infinity;
    this.grid.clues.getClues().forEach(clue => {
      if (clue.isEmpty() && !maxClue) {
        maxClue = clue;
      } else if (clue.isFull()) {
        var value = clue.getValue();
        if (clue.isAutocompleted() && !this.dictionary.contains(value)) {
          maxClue = clue;
          minCompletions = 0;
        }
      } else {
        var completions = this.getCompletionCandidates(clue);
        if (completions.length < minCompletions) {
          maxClue = clue;
          minCompletions = completions.length;
        }
      }
    })
    return maxClue;
  }

  getIntersectingClues(clue) {
    var dir = this.grid.clues.down.indexOf(clue) === -1 ? 'down' : 'across';
    return clue.cells.map(cell => this.grid.getCluesForCell(cell)[dir]).filter(clue => clue);
  }
}
