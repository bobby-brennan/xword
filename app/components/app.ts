import {Component, ApplicationRef} from '@angular/core';
import {DictionaryService} from '../services/dictionary';
declare let $: any;
declare let window: any;

const START_GRID = [
  [' ',' ',' ',' ',' ',' ',' '],
  [' ','X',' ','X',' ',' ',' '],
  [' ','X',' ',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ','X',' '],
  [' ',' ',' ','X',' ','X',' '],
  [' ',' ',' ',' ',' ',' ',' '],
]

@Component({
    selector: 'xword',
    template: `
        <div class="container">
          <div class="row">
            <div class="col-xs-6 col-md-3">
              <label><i class="fa fa-magic"></i>  Autocomplete</label><br>
              <div class="btn-group">
                <button class="btn btn-primary" (click)="autocompleteAll()" [disabled]="autocompleting">
                  <span class="fa fa-play"></span>
                </button>
                <button class="btn btn-primary" (click)="pauseAutocomplete()" [disabled]="!autocompleting">
                  <span class="fa fa-pause"></span>
                </button>
                <button class="btn btn-primary" (click)="autocompleteStep()" [disabled]="autocompleting">
                  <span class="fa fa-step-forward"></span>
                </button>
              </div>
            </div>
            <div class="col-xs-6 col-md-3">
              <label>Size: {{grid.length}}</label><br>
              <div class="btn-group">
                <button class="btn btn-primary fa fa-minus"
                      [disabled]="grid.length <= 5" (click)="changeSize(grid.length - 1)"></button>
                <button class="btn btn-primary fa fa-plus"
                      [disabled]="grid.length >= 30" (click)="changeSize(grid.length + 1)"></button>
              </div>
            </div>
            <div class="col-xs-6 col-md-3">
              <label>Edit Mode</label><br>
              <div class="btn-group">
                <button class="btn btn-primary fa fa-th {{editMode === 'text' ? '' : 'active'}}"
                      (click)="editMode = 'grid'"></button>
                <button class="btn btn-primary fa fa-font {{editMode === 'text' ? 'active' : ''}}"
                      (click)="editMode = 'text'"></button>
              </div>
            </div>
            <div class="col-xs-6 col-md-3">
              <label>Reset</label><br>
              <a class="btn btn-danger fa fa-undo" (click)="reset()"></a>
            </div>
          </div>
          <div class="puzzle" *ngIf="grid">
            <div class="puzzle-row" *ngFor="let row of grid">
              <div class="puzzle-square" *ngFor="let cell of row"
                    (click)="puzzleSquareClick(cell)" [class.filled]="cell.filled">
                <span class="puzzle-number">{{cell.number}}&nbsp;</span>
                <input *ngIf="!cell.filled"
                      class="puzzle-value text-uppercase {{cell.autocompleted ? 'autocompleted' : ''}}"
                      (keyup)="onGridKeyUp($event)"
                      [(ngModel)]="cell.value" (change)="validateCell(cell)">
              </div>
            </div>
          </div>
          <div class="clues row">
            <div *ngFor="let clueSet of [acrossClues, downClues]" class="col-xs-12 col-md-6">
              <h4>{{ clueSet === acrossClues ? 'Across' : 'Down' }}</h4>
              <div *ngFor="let clue of clueSet" class="clue">
                <a (click)="autocomplete(clue)"
                      class="btn btn-sm {{!getAutocompletion(clue) ? 'btn-danger' : 'btn-primary'}}">
                   <span class="fa fa-magic"></span>
                </a>
                <span class="clue-number">{{clue.number}}.</span>
                <input type="text" size="1" [(ngModel)]="cell.value" class="clue-letter text-uppercase"
                     *ngFor="let cell of clue.cells"
                     (change)="clue.impossible = false; cell.autocompleted = false; validateCell(cell)"
                      (keyup)="onKeyUp($event)">
                <input type="text" class="form-control input-sm clue-prompt" [(ngModel)]="clue.prompt">
              </div>
            </div>
          </div>
        </div>
      `,
})
export class AppComponent {
  title: 'XWord';
  grid: any[][];
  acrossClues: any[]=[];
  downClues: any[]=[];
  autocompleteSteps: any;
  autocompleting: boolean=false;
  editMode: string='grid';
  timeout: any;

  constructor(private dictionary: DictionaryService) {
    window.app = this;
    this.dictionary.getData().then(d => console.log('data ready'));
    var grid = window.localStorage.getItem('puzzle');
    if (grid) grid = JSON.parse(grid);
    this.reset(grid);
    setInterval(() => this.save(), 1000)
  }

  reset(grid) {
    this.autocompleteSteps = [];
    this.grid = grid || START_GRID.map(r => r.map(c => {
      return c === 'X' ? {filled: true} : {}
    }));
    this.resetGrid();
  }

  save() {
    window.localStorage.setItem('puzzle', JSON.stringify(this.grid));
  }

  onKeyUp(event) {
    if (event.key === 'Backspace') $(':focus').prev().focus();
    else if (event.key.match(/[\w]/) && event.key.length === 1) $(':focus').next().focus();
  }

  onGridKeyUp(event) {
    var focused = $(':focus');
    var cell = focused.parent();
    var row = cell.parent();
    var colIdx = row.children().index(cell.get(0));
    if (event.key === 'Backspace' || event.key === 'ArrowLeft') cell.prev().find('input').focus();
    else if (event.key.match(/[\w]/) && event.key.length === 1 || event.key === 'ArrowRight') cell.next().find('input').focus();
    else if (event.key === 'ArrowUp') row.prev().children().eq(colIdx).find('input').focus();
    else if (event.key === 'ArrowDown') row.next().children().eq(colIdx).find('input').focus();
  }

  puzzleSquareClick(cell) {
    if (this.editMode !== 'text') {
      cell.filled = !cell.filled;
      this.getMirrorCell(cell).filled = cell.filled;
      this.resetGrid();
      return false;
    }
  }

  changeSize(newSize) {
    while (newSize < this.grid.length) {
      this.grid.forEach(r => r.pop());
      this.grid.pop();
    }
    while (newSize > this.grid.length) {
      var newRow = [];
      for (var i = 0; i < this.grid.length; ++i) newRow.push({});
      this.grid.push(newRow);
      this.grid.forEach(r => r.push({}))
    }
    this.resetGrid();
  }

  validateCell(cell) {
    if (!cell.value) return;
    var c = cell.value.length - 1;
    while (c >= 0 && !cell.value.charAt(c).match(/\w/)) --c
    if (c < 0) cell.value = '';
    else cell.value = cell.value.charAt(c);
  }

  getCells(direction, start, length) {
    if (direction === 'across') {
      return this.grid[start[0]].filter((c, idx) => idx >= start[1] && idx < start[1] + length);
    } else {
      var cells = [];
      this.grid.forEach((row, i) => {
        if (i >= start[0] && i < start[0] + length) {
          cells.push(row[start[1]]);
        }
      })
      return cells;
    }
  }

  getMirrorCell(cell) {
    var mCell = null;
    this.grid.forEach((row, rowIdx) => {
      row.forEach((otherCell, cellIdx) => {
        if (cell === otherCell) {
          mCell = this.grid[this.grid.length - rowIdx - 1][this.grid.length - cellIdx - 1];
        }
      })
    })
    return mCell;
  }

  mirrorFilledCells() {
    this.grid.forEach((row, rowIdx) => {
      row.forEach((cell, cellIdx) => {
        var loc = [rowIdx, cellIdx];
        var mirrorLoc = [this.grid.length - loc[0] - 1, this.grid.length - loc[1] - 1];
        this.grid[mirrorLoc[0]][mirrorLoc[1]].filled = cell.filled;
      })
    })
  }

  resetGrid() {
    this.mirrorFilledCells();
    var cur = 1;
    this.downClues = [];
    this.acrossClues = [];
    this.grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell.filled) return;
        delete cell.number;
        var above = i === 0 ? true : this.grid[i-1][j].filled;
        var below = i === this.grid.length - 1 ? true : this.grid[i+1][j].filled;
        var left  = j === 0 ? true : this.grid[i][j-1].filled;
        var right = j === this.grid[0].length - 1 ? true : this.grid[i][j+1].filled;
        if ((above && !below) || (left && !right)) {
          if (above && !below) {
            var length = 0;
            while (i + length < this.grid.length && !this.grid[i + length][j].filled) ++length;
            var clue = {number: cur, length: length, start: [i, j], cells: []};
            clue.cells = this.getCells('down', clue.start, clue.length);
            this.downClues.push(clue);
          }
          if (left && !right) {
            var length = 0;
            while (j + length < this.grid[0].length && !this.grid[i][j+length].filled) ++length;
            var clue = {number: cur, length: length, start: [i, j], cells: []};
            clue.cells = this.getCells('across', clue.start, clue.length);
            this.acrossClues.push(clue);
          }
          cell.number = cur++;
        }
      })
    })
  }

  getMostConstrainedClue() {
    var maxClue = null;
    var maxConstraint = -1.0;
    this.acrossClues.concat(this.downClues).forEach(clue => {
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

  autocompleteAll() {
    this.autocompleting = true;
    var nextStep = () => {
      var completed = this.autocompleteStep();
      if (completed) {
        this.timeout = setTimeout(() => nextStep(), 1)
      } else {
        this.autocompleting = false;
      }
    }
    nextStep();
  }

  pauseAutocomplete() {
    clearTimeout(this.timeout);
    this.timeout = null;
    this.autocompleting = false;
  }

  autocompleteStep() {
    var nextClue = this.getMostConstrainedClue();
    if (!nextClue) return;
    var blanks = nextClue.cells.filter(c => !c.value);
    var completion = this.autocomplete(nextClue);
    if (completion) {
      var firstAttempt = nextClue.cells.map(c => c.value).join('');
      var lastAttempt = firstAttempt;
      this.autocompleteSteps.push({
        firstAttempt,
        lastAttempt,
        blanks,
        clue: nextClue,
      });
    } else {
      if (!this.unwindAutocompletion(this.getIntersectingClues(nextClue))) {
        console.log("Can't unwind anymore");
        return;
      }
    }
    return true;
  }

  unwindAutocompletion(targetClues=null) {
    var lastStep = this.autocompleteSteps.pop();
    if (!lastStep) return;
    lastStep.blanks.forEach(c => c.value = '');
    if (targetClues && targetClues.indexOf(lastStep.clue) === -1) {
      return this.unwindAutocompletion();
    }
    var completion = this.autocomplete(lastStep.clue, lastStep.lastAttempt, lastStep.firstAttempt);
    if (completion) {
      lastStep.lastAttempt = completion;
      this.autocompleteSteps.push(lastStep);
      return true;
    } else {
      return this.unwindAutocompletion();
    }
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
        var dir = this.downClues.indexOf(clue) === -1 ? 'down' : 'across';
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
    }
    return completion;
  }

  getIntersectingClues(clue) {
    var dir = this.downClues.indexOf(clue) === -1 ? 'down' : 'across';
    return clue.cells.map(cell => this.getCluesForCell(cell)[dir]).filter(clue => clue);
  }

  getCluesForCell(cell) {
    var down = this.downClues.filter(clue => clue.cells.indexOf(cell) !== -1)[0];
    var across = this.acrossClues.filter(clue => clue.cells.indexOf(cell) !== -1)[0];
    return {down, across}
  }
}
