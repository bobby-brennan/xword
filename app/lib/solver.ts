
export class Cell {
  value: string;
  autocompleted: boolean;
  filled: boolean;
  number: number;
}

export class Clue {
  prompt: string;

  constructor(public number:number, public cells: Cell[]) {
  }

  isEmpty() {
    return !this.cells.filter(c => c.value ? true : false).length;
  }
  isFull() {
    return !this.cells.filter(c => !c.value).length;
  }
  isAutocompleted() {
    return this.cells.filter(c => c.autocompleted).length;
  }
}

export class ClueSet {
  constructor(public down:Clue[], public across:Clue[]) {}

  getClues() {
    return this.across.concat(this.down);
  }
}

export class Solver {
  steps: any[]=[];

  constructor(private dictionary, private grid: Cell[][], private clues: ClueSet) {
  }

  getCompletionCandidates(clue) {
    var cands = this.dictionary.byLength[clue.cells.length - 1];
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
    if (!nextClue) return;
    if (nextClue.isAutocompleted() && nextClue.isFull()) {
      this.unwind(this.getIntersectingClues(nextClue));
      return true;
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
    } else {
      this.unwind(this.getIntersectingClues(nextClue));
    }
    return true;
  }

  unwind(targetClues=null) {
    var lastStep = this.steps.pop();
    if (!lastStep) return;
    lastStep.blanks.forEach(c => c.value = '');
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

  getMostConstrainedClue() {
    var maxClue = null;
    var minCompletions = Infinity;
    this.clues.getClues().forEach(clue => {
      if (clue.isEmpty() && !maxClue) {
        maxClue = clue;
      } else if (clue.isFull()) {
        var value = clue.cells.map(c => c.value).join('');
        var isAutocompleted = clue.cells.filter(c => c.autocompleted).length;
        if (isAutocompleted && !this.dictionary.contains(value)) {
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
    var dir = this.clues.down.indexOf(clue) === -1 ? 'down' : 'across';
    return clue.cells.map(cell => this.getCluesForCell(cell)[dir]).filter(clue => clue);
  }

  getCluesForCell(cell) {
    var down = this.clues.down.filter(clue => clue.cells.indexOf(cell) !== -1)[0];
    var across = this.clues.across.filter(clue => clue.cells.indexOf(cell) !== -1)[0];
    return {down, across}
  }
}
