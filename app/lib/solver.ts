

export class Solver {
  steps: any[]=[];

  constructor(private dictionary, private grid, private clues) {
  }

  getAutocompletion(clue, startVal='', endVal='', checkBigrams=false) {
    clue.impossible = false;
    var cands = this.dictionary.byLength[clue.length - 1];
    var startIdx = Math.floor(Math.random() * cands.length);
    if (startVal) {
      cands.forEach((cand, idx) => {
        if (cand.word === startVal) startIdx = idx + 1;
      })
    }
    for (var i = 0; i < cands.length; ++i) {
      var cand = cands[(i + startIdx) % cands.length];
      if (endVal && endVal === cand.word) return;
      var match = true;
      for (var j = 0; match && j < clue.cells.length; ++j) {
        var l = clue.cells[j].value;
        if (l && cand.word.charAt(j) !== l) match = false;
      }
      if (!match) continue;

      if (checkBigrams) {
        var bigramsAreOK = true;
        var dir = this.clues.down.indexOf(clue) === -1 ? 'down' : 'across';
        clue.cells.forEach((cell, idx) => {
          var iClue = this.getCluesForCell(cell)[dir];
          if (!iClue) return;
          var cellIdx = iClue.cells.indexOf(cell);
          if (cellIdx > 0 && iClue.cells[cellIdx - 1].value) {
            var leftBigram = iClue.cells[cellIdx - 1].value + cand.word.charAt(idx);
            if (!this.dictionary.bigrams[leftBigram]) bigramsAreOK = false;
          }
          if (cellIdx < iClue.cells.length - 1 && iClue.cells[cellIdx + 1].value) {
            var rightBigram = cand.word.charAt(idx) + iClue.cells[cellIdx + 1].value;
            if (!this.dictionary.bigrams[rightBigram]) bigramsAreOK = false;
          }
        })
        if (!bigramsAreOK) continue;
      }
      return cand.word;
    }
    clue.impossible = true;
    return false;
  }
  autocomplete(clue, startVal='', endVal='') {
    var completion = this.getAutocompletion(clue, startVal, endVal, true);
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
    var maxConstraint = -1.0;
    this.clues.across.concat(this.clues.down).forEach(clue => {
      if (clue.cells.filter(c => !c.value).length && !this.getAutocompletion(clue)) {
        maxClue = clue;
        maxConstraint = 1.0;
      } else {
        var constraint = clue.cells.filter(c => c.value).length / clue.length;
        if (constraint < 1.0 && constraint > maxConstraint) {
          maxClue = clue;
          maxConstraint = constraint;
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
