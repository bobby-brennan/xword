import {Clue, ClueSet, Grid, Cell} from './grid';

const CHECK_BIGRAMS = false;
const UNWIND_TO_TARGET_CLUES = true;
const LOG = false;
const NUM_TRIES_BEFORE_UNWIND = 10;
const CELL_BY_CELL = true;

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

export class Solver {
  steps: any[]=[];

  constructor(private dictionary, private grid: Grid) {
  }

  getCompletionCandidates(clue) {
    var intersectingClues = this.grid.getIntersectingClues(clue);
    var cands = this.dictionary.byLength[clue.cells.length - 1];
    if (!cands) return [];
    cands = cands.filter(cand => {
      var match = true;
      for (var j = 0; match && j < clue.cells.length; ++j) {
        var l = clue.cells[j].value;
        if (l && cand.word.charAt(j) !== l) match = false;
      }
      return match;
    }).filter(cand => {
      if (!CHECK_BIGRAMS) return true;
      var bigramsOK = true;
      clue.cells.forEach((cell, cellIdx) => {
        if (!bigramsOK) return;
        var candValueForCell = cand.word.charAt(cellIdx);
        var iClue = intersectingClues.filter(iClue => iClue.cells.indexOf(cell) !== -1)[0];
        if (!iClue) return;
        var cellIdx = iClue.cells.indexOf(cell);
        var leftCell = iClue.cells[cellIdx - 1];
        var rightCell = iClue.cells[cellIdx + 1];
        if (leftCell && leftCell.value) {
          var leftBigram = leftCell.value + candValueForCell;
          if (!this.dictionary.bigrams[leftBigram]) bigramsOK = false;
        }
        if (rightCell && rightCell.value) {
          var rightBigram = candValueForCell + rightCell.value;
          if (!this.dictionary.bigrams[rightBigram]) bigramsOK = false;
        }
      })
      return bigramsOK;
    })
    return cands;
  }

  getAutocompletion(clue, startVal='', endVal='') {
    var candidates = this.getCompletionCandidates(clue).map(c => c.word);
    if (!candidates.length) return;
    var idx = startVal ? candidates.indexOf(startVal) + 1 : Math.floor(Math.random() * candidates.length);
    var cand = candidates[idx % candidates.length];
    return cand === endVal ? null : cand;
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
    if (CELL_BY_CELL) return this.stepOneCell();
    else return this.stepOneWord()
  }

  stepOneCell() {
    var nextClue = this.getMostConstrainedClue();
    if (LOG) console.log('solving', nextClue);
    if (!nextClue) {
      this.fillPrompts();
      return true;
    }
    if (nextClue.isAutocompleted() && nextClue.isFull()) {
      if (LOG) console.log('filled wrong');
      return this.goBackOneCellStep() ? null : false;
    }
    var candidates = this.getCompletionCandidates(nextClue);
    var possibilitiesForCells = nextClue.cells.map(c => ({}));
    candidates.forEach(c => {
      possibilitiesForCells.forEach((p, idx) => {
        p[c.word.charAt(idx)] = true;
      })
    })
    var mostConstrainedIdx = -1;
    var minPossibilities = 27;
    possibilitiesForCells.forEach((p, idx) => {
      if (nextClue.cells[idx].value) return;
      var numPossibilities = Object.keys(p).length;
      if (numPossibilities < minPossibilities) {
        minPossibilities = numPossibilities;
        mostConstrainedIdx = idx;
      }
    })
    if (LOG) console.log('filling char ' + mostConstrainedIdx);
    if (minPossibilities === 0) {
      if (LOG) console.log('no possible fills');
      return this.goBackOneCellStep() ? null : false;
    }
    var cellToFill = nextClue.cells[mostConstrainedIdx];
    var possibleValues = Object.keys(possibilitiesForCells[mostConstrainedIdx]);
    var step = {
      cell: cellToFill,
      possibilities: possibleValues,
      numTries: 0,
    };
    this.executeStep(step);
    return null;
  }

  executeStep(step) {
    step.numTries++;
    if (step.cell.value) {
      step.cell.value = step.possibilities[(step.possibilities.indexOf(step.cell.value) + 1) % step.possibilities.length]
    } else {
      step.cell.value = step.possibilities[Math.floor(Math.random() * step.possibilities.length)];
    }
    step.cell.autocompleted = true;
    if (LOG) console.log(step.cell.value);
    var affectedClues = this.grid.getCluesForCell(step.cell);
    if (affectedClues.across) this.setConstraint(affectedClues.across);
    if (affectedClues.down) this.setConstraint(affectedClues.down);
    this.steps.push(step);
  }

  goBackOneCellStep() {
    var lastStep = this.steps.pop();
    if (!lastStep) return false;
    lastStep.cell.value = '';
    if (lastStep.numTries >= lastStep.possibilities.length) {
      return this.goBackOneCellStep();
    }
    this.executeStep(lastStep);
    if (LOG) console.log('try ' + lastStep.numTries);
    return true;
  }

  stepOneWord() {
    var nextClue = this.getMostConstrainedClue();
    if (!nextClue) {
      this.fillPrompts();
      return true;
    }
    if (LOG) console.log('clue', nextClue);
    if (nextClue.isAutocompleted() && nextClue.isFull()) {
      if (LOG) console.log('filled wrong');
      return this.tryLastStepAgain(nextClue) ? null : false;
    }
    var blanks = nextClue.cells.filter(c => !c.value);
    var candidates = this.getCompletionCandidates(nextClue);
    if (!candidates.length) {
      if (LOG) console.log('no candidates');
      return this.tryLastStepAgain(nextClue) ? null : false;
    }
    shuffleArray(candidates);
    var firstAttempt = Math.floor(Math.random() * candidates.length);
    var latestAttempt = firstAttempt;
    nextClue.autocomplete(candidates[firstAttempt]);
    if (LOG) console.log('filled', candidates[firstAttempt].word);
    this.updateConstraints(nextClue)
    this.steps.push({
      clue: nextClue,
      candidates,
      firstAttempt,
      latestAttempt,
      blanks,
    });
    return null;
  }

  tryLastStepAgain(badClue: Clue) {
    var intersectingClues = this.grid.getIntersectingClues(badClue);
    var lastStep = this.steps.pop();
    if (!lastStep) return;
    if (LOG) console.log('undo', lastStep.clue.getValue(), lastStep);
    lastStep.blanks.filter(c => c.autocompleted).forEach(c => c.value = '');
    lastStep.clue.prompt = '';
    if (UNWIND_TO_TARGET_CLUES && intersectingClues.indexOf(lastStep.clue) === -1 && this.steps.length) {
      return this.tryLastStepAgain(badClue);
    }
    lastStep.latestAttempt = (lastStep.latestAttempt + 1) % lastStep.candidates.length;
    if (lastStep.latestAttempt === lastStep.firstAttempt) {
      return this.tryLastStepAgain(badClue);
    }
    var numAttempts = lastStep.latestAttempt > lastStep.firstAttempt ?
          lastStep.latestAttempt - lastStep.firstAttempt :
          (lastStep.candidates.length - lastStep.firstAttempt) + lastStep.latestAttempt;
    if (numAttempts >= NUM_TRIES_BEFORE_UNWIND) {
      return this.tryLastStepAgain(badClue);
    }
    if (LOG) console.log('attempt', numAttempts);
    var completion = lastStep.candidates[lastStep.latestAttempt];
    lastStep.clue.autocomplete(completion);
    this.updateConstraints(lastStep.clue);
    if (LOG) console.log('filled', completion.word);
    this.steps.push(lastStep);
    return true;
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
      var numCands = this.getCompletionCandidates(clue).length;
      clue.constraint = numCands;
    }
  }
}
