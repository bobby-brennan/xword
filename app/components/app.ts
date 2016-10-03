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
                      class="puzzle-value text-uppercase"
                      (keyup)="onGridKeyUp($event)"
                      [(ngModel)]="cell.value" (change)="validateCell(cell)">
              </div>
            </div>
          </div>
          <div class="clues row">
            <div *ngFor="let clueSet of [acrossClues, downClues]" class="col-xs-12 col-md-6">
              <h4>{{ clueSet === acrossClues ? 'Across' : 'Down' }}</h4>
              <div *ngFor="let clue of clueSet" class="clue">
                <span class="clue-number">{{clue.number}}.</span>
                <input type="text" size="1" [(ngModel)]="cell.value" class="clue-letter text-uppercase"
                     *ngFor="let cell of clue.cells"
                     (change)="validateCell(cell)"
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

  constructor(private dictionary: DictionaryService) {
    window.app = this;
    this.numberGrid();
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
    console.log('col', colIdx);
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

}
