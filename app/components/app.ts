import {Component, ApplicationRef} from '@angular/core';
import {Solver, Clue, Cell, ClueSet} from '../lib/solver';
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
                <button class="btn btn-primary" (click)="startAutocomplete()" [disabled]="autocompleting">
                  <span class="fa fa-play"></span>
                </button>
                <button class="btn btn-primary" (click)="pauseAutocomplete()" [disabled]="!autocompleting">
                  <span class="fa fa-pause"></span>
                </button>
                <button class="btn btn-primary" (click)="solver.step()" [disabled]="autocompleting">
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
              <div class="btn-group">
                <a class="btn btn-danger fa fa-trash" (click)="reset()"></a>
                <a class="btn btn-danger fa fa-font" (click)="resetText()"></a>
              </div>
            </div>
          </div>
          <div *ngIf="alert" class="alert alert-{{alert.class}}">
            {{alert.text}}
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
            <div *ngFor="let clueSet of [clues.across, clues.down]" class="col-xs-12 col-md-6">
              <h4>{{ clueSet === clues.across ? 'Across' : 'Down' }}</h4>
              <div *ngFor="let clue of clueSet" class="clue">
                <a (click)="solver.autocomplete(clue)"
                      class="btn btn-sm {{!solver.getAutocompletion(clue) ? 'btn-danger' : 'btn-primary'}}">
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
  grid: Cell[][];
  clues: ClueSet;
  autocompleting: boolean=false;
  editMode: string='text';
  timeout: any;
  alert: any;

  solver: Solver;

  constructor(private dictionary: DictionaryService) {
    window.app = this;
    this.clues = new ClueSet([], []);
    this.grid = [[]];
    this.dictionary.getData().then(d => {
      this.reset(this.maybeLoad());
      this.solver = new Solver(this.dictionary, this.grid, this.clues);
      setInterval(() => this.save(), 1000)
    });
  }

  maybeLoad() {
    var grid = window.localStorage.getItem('puzzle');
    if (!grid) return;
    grid = JSON.parse(grid);
    return grid.map(row => row.map(cell => new Cell(cell)))
  }

  reset(grid) {
    this.pauseAutocomplete();
    this.alert = null;
    this.grid = grid || START_GRID.map(r => r.map(c => {
      return c === 'X' ? {filled: true} : {}
    }));
    this.resetGrid();
    this.solver = new Solver(this.dictionary, this.grid, this.clues);
    this.solver.fillPrompts();
  }

  resetText() {
    this.pauseAutocomplete();
    this.alert = null;
    this.grid.forEach(row => {
      row.forEach(cell => {
        cell.autocompleted = false;
        cell.value = '';
      })
    })
    this.clues.getClues().forEach(c => c.prompt = '');
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

  puzzleSquareClick(cell: Cell) {
    if (this.editMode !== 'text') {
      cell.toggleFill();
      this.getMirrorCell(cell).toggleFill();
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
      for (var i = 0; i < this.grid.length; ++i) newRow.push(new Cell());
      this.grid.push(newRow);
      this.grid.forEach(r => r.push(new Cell()))
    }
    this.resetGrid();
  }

  validateCell(cell) {
    if (!cell.value) return;
    cell.autocompleted = false;
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
    this.clues.down = [];
    this.clues.across = [];
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
            var clue = new Clue(cur, this.getCells('down', [i,j], length));
            this.clues.down.push(clue);
          }
          if (left && !right) {
            var length = 0;
            while (j + length < this.grid[0].length && !this.grid[i][j+length].filled) ++length;
            var clue = new Clue(cur, this.getCells('across', [i,j], length));
            this.clues.across.push(clue);
          }
          cell.number = cur++;
        }
      })
    })
  }

  startAutocomplete() {
    this.autocompleting = true;
    this.alert = {class: 'info', text: "Solving..."}
    var nextStep = () => {
      var completed = this.solver.step();
      if (completed === null) {
        this.timeout = setTimeout(() => nextStep(), 1)
      } else {
        if (completed) {
          this.alert = {class: 'success', text: "Solved!"}
        } else {
          this.alert = {class: 'danger', text: "No solution found."}
        }
        this.autocompleting = false;
      }
    }
    nextStep();
  }

  pauseAutocomplete() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = null;
    this.autocompleting = false;
    this.alert = null;
  }
}
