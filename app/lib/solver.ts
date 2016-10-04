export class Cell {
  value: string;
  autocompleted: boolean;
  filled: boolean;
  number: number;

  constructor(cell?: Cell) {
    if (cell) {
      this.value = cell.value;
      this.autocompleted = cell.autocompleted;
      this.filled = cell.filled;
      this.number = cell.number;
    }
  }

  toggleFill() {
    this.filled = !this.filled;
    if (this.filled) this.number = null;
  }
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
  getValue() {
    return this.cells.map(c => c.value).join('');
  }
}

export class ClueSet {
  constructor(public down:Clue[]=[], public across:Clue[]=[]) {}

  getClues() {
    return this.across.concat(this.down);
  }
}

export class Grid {
  constructor(public cells?: Cell[][], public clues?: ClueSet) {
    if (!this.clues) this.clues = new ClueSet();
    if (!this.cells) this.cells = [[]];
    this.reset();
  }

  changeSize(newSize) {
    while (newSize < this.cells.length) {
      this.cells.forEach(r => r.pop());
      this.cells.pop();
    }
    while (newSize > this.cells.length) {
      var newRow = [];
      for (var i = 0; i < this.cells.length; ++i) newRow.push(new Cell());
      this.cells.push(newRow);
      this.cells.forEach(r => r.push(new Cell()))
    }
    this.reset();
  }

  getCells(direction, start, length) {
    if (direction === 'across') {
      return this.cells[start[0]].filter((c, idx) => idx >= start[1] && idx < start[1] + length);
    } else {
      var cells = [];
      this.cells.forEach((row, i) => {
        if (i >= start[0] && i < start[0] + length) {
          cells.push(row[start[1]]);
        }
      })
      return cells;
    }
  }

  getMirrorCell(cell) {
    var mCell = null;
    this.cells.forEach((row, rowIdx) => {
      row.forEach((otherCell, cellIdx) => {
        if (cell === otherCell) {
          mCell = this.cells[this.cells.length - rowIdx - 1][this.cells.length - cellIdx - 1];
        }
      })
    })
    return mCell;
  }

  mirrorFilledCells() {
    this.cells.forEach((row, rowIdx) => {
      row.forEach((cell, cellIdx) => {
        var loc = [rowIdx, cellIdx];
        var mirrorLoc = [this.cells.length - loc[0] - 1, this.cells.length - loc[1] - 1];
        this.cells[mirrorLoc[0]][mirrorLoc[1]].filled = cell.filled;
      })
    })
  }

  reset() {
    this.mirrorFilledCells();
    var cur = 1;
    this.clues.down = [];
    this.clues.across = [];
    this.cells.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.filled) return;
        delete cell.number;
        var above = i === 0 ? true : this.cells[i-1][j].filled;
        var below = i === this.cells.length - 1 ? true : this.cells[i+1][j].filled;
        var left  = j === 0 ? true : this.cells[i][j-1].filled;
        var right = j === this.cells[0].length - 1 ? true : this.cells[i][j+1].filled;
        if ((above && !below) || (left && !right)) {
          if (above && !below) {
            var length = 0;
            while (i + length < this.cells.length && !this.cells[i + length][j].filled) ++length;
            var clue = new Clue(cur, this.getCells('down', [i,j], length));
            this.clues.down.push(clue);
          }
          if (left && !right) {
            var length = 0;
            while (j + length < this.cells[0].length && !this.cells[i][j+length].filled) ++length;
            var clue = new Clue(cur, this.getCells('across', [i,j], length));
            this.clues.across.push(clue);
          }
          cell.number = cur++;
        }
      })
    })
  }

  resetText() {
    this.cells.forEach(row => {
      row.forEach(cell => {
        cell.autocompleted = false;
        cell.value = '';
      })
    })
    this.clues.getClues().forEach(c => c.prompt = '');
  }

}

export class Solver {
  steps: any[]=[];

  constructor(private dictionary, private grid: Grid) {
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
    console.log('next', nextClue);
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

  fillPrompts() {
    this.grid.clues.getClues().forEach(clue => {
      if (!clue.prompt) clue.prompt = this.dictionary.getPrompt(clue.getValue());
    })
  }

  getMostConstrainedClue() {
    var maxClue = null;
    var minCompletions = Infinity;
    this.grid.clues.getClues().forEach(clue => {
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
    var dir = this.grid.clues.down.indexOf(clue) === -1 ? 'down' : 'across';
    return clue.cells.map(cell => this.getCluesForCell(cell)[dir]).filter(clue => clue);
  }

  getCluesForCell(cell) {
    var down = this.grid.clues.down.filter(clue => clue.cells.indexOf(cell) !== -1)[0];
    var across = this.grid.clues.across.filter(clue => clue.cells.indexOf(cell) !== -1)[0];
    return {down, across}
  }
}
