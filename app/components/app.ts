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
              </div>
            </div>
          </div>
        </div>
      `,
})
export class AppComponent {
  title: 'XWord';
  grid: any[][]=START_GRID.map(r => r.map(c => {
    console.log('c', c);
    return c === 'X' ? {filled: true} : {}
  }));

  constructor() {
    window.app = this;
    this.numberGrid();
  }

  numberGrid() {
    var cur = 1;
    this.grid.forEach((row, i) => {
      row.forEach((cell, j) => {
        console.log(i, j);
        var above = i === 0 ? true : this.grid[i-1][j].filled;
        var below = i === this.grid.length - 1 ? true : this.grid[i+1][j].filled;
        var left  = j === 0 ? true : this.grid[i][j-1].filled;
        var right = j === this.grid[0].length - 1 ? true : this.grid[i][j+1].filled;
        if ((above && !below) || (left && !right)) cell.number = cur++;
      })
    })
  }
}
