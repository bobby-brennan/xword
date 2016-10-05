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
      return this.tryLastStepAgain() ? null : false;
    }
    var blanks = nextClue.cells.filter(c => !c.value);
    var completion = this.autocomplete(nextClue);
    if (completion) {
      this.updateConstraints(nextClue);
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
      return this.tryLastStepAgain() ? null : false;
    }
  }

  tryLastStepAgain() {
    var lastStep = this.steps.pop();
    if (!lastStep) return;
    lastStep.blanks.filter(c => c.autocompleted).forEach(c => c.value = '');
    lastStep.clue.prompt = '';
    var completion = this.autocomplete(lastStep.clue, lastStep.lastAttempt, lastStep.firstAttempt);
    this.updateConstraints(lastStep.clue);
    if (completion) {
      lastStep.lastAttempt = completion;
      this.steps.push(lastStep);
      return true;
    } else {
      return this.tryLastStepAgain();
    }
  }

  fillPrompts() {
    this.grid.clues.getClues().forEach(clue => {
      if (!clue.prompt && clue.isFull()) clue.prompt = this.dictionary.getPrompt(clue.getValue());
    })
  }

  getMostConstrainedClue() {
    var clue = this.grid.clues.getClues().sort((c1, c2) => c1.constraint - c2.constraint)[0];
    if (clue.isFull() && this.dictionary.contains(clue.getValue())) return
    return clue;
  }

  updateConstraints(clue?) {
    if (!clue) {
      this.grid.clues.getClues().forEach(c => this.setConstraint(c))
    } else {
      this.setConstraint(clue);
      this.grid.getIntersectingClues(clue).forEach(c => this.setConstraint(c));
    }
  }

  setConstraint(clue) {
    if (clue.isFull()) {
      var value = clue.getValue();
      if (clue.isAutocompleted() && !this.dictionary.contains(value)) {
        clue.constraint = 0;
      } else {
        clue.constraint = Infinity;
      }
    } else {
      clue.constraint = this.getCompletionCandidates(clue).length;
    }
  }
}
