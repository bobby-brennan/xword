import {Component, ApplicationRef} from '@angular/core';
import {DictionaryService} from '../services/dictionary';
declare let $: any;
declare let window: any;

const START_GRID = [
  ['X',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
  [' ','X','X',' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ','X',' ',' ',' ',' ','X','X',' '],
  [' ',' ',' ',' ','X',' ','X',' ',' ',' ',' ',' ','X'],
  [' ',' ',' ',' ',' ',' ','X',' ',' ',' ',' ',' ','X'],
  ['X',' ',' ',' ',' ',' ','X',' ',' ',' ',' ',' ',' '],
  ['X',' ',' ',' ',' ',' ','X',' ',' ',' ',' ',' ',' '],
  [' ','X','X',' ',' ',' ','X',' ','X',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ',' ',' ','X',' ',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' '],
  [' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','X','X',' '],
  [' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','X'],
]

@Component({
    selector: 'xword',
    template: `
        <div class="container">
          <div class="puzzle" *ngIf="grid">
            <div class="puzzle-row" *ngFor="let row of grid">
              <div class="puzzle-square" *ngFor="let cell of row"
                    (click)="cell.filled = !cell.filled; numberGrid()" [class.filled]="cell.filled">
                <span class="puzzle-number">{{cell.number}}&nbsp;</span>
                <input *ngIf="!cell.filled"
                      class="puzzle-value text-uppercase {{cell.autocompleted ? 'autocompleted' : ''}}"
                      (keyup)="onGridKeyUp($event)"
                      [(ngModel)]="cell.value" (change)="validateCell(cell)">
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-xs-12">
              <a class="btn btn-primary" (click)="autocompleteAll()">
                <span class="fa fa-magic"></span> &nbsp;
                Auto-complete Puzzle
              </a>
            </div>
          </div>
          <div class="clues row">
            <div *ngFor="let clueSet of [acrossClues, downClues]" class="col-xs-12 col-md-6">
              <h4>{{ clueSet === acrossClues ? 'Across' : 'Down' }}</h4>
              <div *ngFor="let clue of clueSet" class="clue">
                <a (click)="autocomplete(clue)" class="btn btn-sm {{clue.impossible ? 'btn-danger' : 'btn-primary'}}"><span class="fa fa-magic"></span></a>
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
  grid: any[][]=START_GRID.map(r => r.map(c => {
    return c === 'X' ? {filled: true} : {}
  }));
  acrossClues: any[]=[];
  downClues: any[]=[];
  autocompleteSteps: any[];

  constructor(private dictionary: DictionaryService) {
    window.app = this;
    this.numberGrid();
    this.dictionary.getData().then(d => console.log('data ready'))
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

  numberGrid() {
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
      var constraint = clue.cells.filter(c => c.value).length / clue.length;
      if (constraint < 1.0 && constraint > maxConstraint) {
        maxClue = clue;
        maxConstraint = constraint;
      }
    })
    return maxClue;
  }

  autocompleteAll() {
    setTimeout(() => {
      var completed = this.autocompleteStep();
      if (completed) this.autocompleteAll();
    }, 10)
  }

  autocompleteStep() {
    this.autocompleteSteps = this.autocompleteSteps || [];
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
      this.unwindAutocompletion();
    }
    return true;
  }

  unwindAutocompletion() {
    var lastStep = this.autocompleteSteps.pop();
    lastStep.blanks.forEach(c => c.value = '');
    var completion = this.autocomplete(lastStep.clue, lastStep.lastAttempt, lastStep.firstAttempt);
    if (completion) {
      lastStep.lastAttempt = completion;
      this.autocompleteSteps.push(lastStep);
    } else {
      this.unwindAutocompletion();
    }
  }

  autocomplete(clue, startVal='', endVal='') {
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
      if (match) {
        clue.cells.forEach((c, idx) => {
          c.value = cand.word.charAt(idx);
          c.autocompleted = true;
        })
        return cand.word;
      }
    }
    clue.impossible = true;
    return false;
  }
}
