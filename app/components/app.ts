import {Component, ApplicationRef} from '@angular/core';
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
                <span class="puzzle-value text-uppercase">{{cell.value}}</span>
              </div>
            </div>
          </div>
          <div class="clues row">
            <div *ngFor="let clueSet of [acrossClues, downClues]" class="col-xs-12 col-md-6">
              <h4>{{ clueSet === acrossClues ? 'Across' : 'Down' }}</h4>
              <div *ngFor="let clue of clueSet" class="clue">
                <div class="input-group">
                  <span class="clue-number">{{clue.number}}.</span>
                  <input type="text" size="1" [(ngModel)]="cell.value" class="text-uppercase"
                       *ngFor="let cell of clue.cells"
                       (change)="cell.value = cell.value ? cell.value.charAt(cell.value.length - 1) : ''"
                        (keyup)="onKeyUp($event)">
                </div>
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

  constructor() {
    window.app = this;
    this.numberGrid();
  }

  onKeyUp(event) {
    console.log(event);
    if (event.key === 'Backspace') this.reverseInput();
    else if (event.key.match(/[\w]/) && event.key.length === 1) this.advanceInput();
  }
  advanceInput() {
    $(':focus').next().focus();
  }
  reverseInput() {
    $(':focus').prev().focus();
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
