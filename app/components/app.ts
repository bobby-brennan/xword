import {Component, ApplicationRef} from '@angular/core';
import {Solver} from '../lib/solver';
import {Clue, Cell, ClueSet, Grid} from '../lib/grid';
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
              <label>Size: {{grid.cells.length}}</label><br>
              <div class="btn-group">
                <button class="btn btn-primary fa fa-minus"
                      [disabled]="grid.cells.length <= 5" (click)="grid.changeSize(grid.cells.length - 1)"></button>
                <button class="btn btn-primary fa fa-plus"
                      [disabled]="grid.cells.length >= 30" (click)="grid.changeSize(grid.cells.length + 1)"></button>
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
            <div class="puzzle-row" *ngFor="let row of grid.cells">
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
            <div *ngFor="let clueSet of ['across', 'down']" class="col-xs-12 col-md-6">
              <h4 class="text-uppercase">{{ clueSet }}</h4>
              <div *ngFor="let clue of grid.clues[clueSet]" class="clue">
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
  grid: Grid;
  autocompleting: boolean=false;
  editMode: string='text';
  timeout: any;
  alert: any;

  solver: Solver;

  constructor(private dictionary: DictionaryService) {
    window.app = this;
    this.grid = new Grid();
    this.dictionary.getData().then(d => {
      this.reset(this.maybeLoad());
      this.solver = new Solver(this.dictionary, this.grid);
      setInterval(() => this.save(), 1000)
    });
  }

  maybeLoad() {
    try {
      var grid = window.localStorage.getItem('puzzle');
      if (!grid) return;
      grid = JSON.parse(grid);
      return new Grid(grid.map(row => row.map(cell => new Cell(cell))))
    } catch (e) {
      console.log("Error loading puzzle");
      console.log(e);
    }
  }

  reset(grid=null) {
    this.pauseAutocomplete();
    this.alert = null;
    if (grid) {
      this.grid = grid;
    } else {
      var cells = cells || START_GRID.map(r => r.map(c => {
        var cell = new Cell();
        if (c === 'X') cell.toggleFill();
        return cell;
      }));
      this.grid = new Grid(cells);
    }
    this.solver = new Solver(this.dictionary, this.grid);
    this.solver.fillPrompts();
  }

  resetText() {
    this.alert = null;
    this.pauseAutocomplete();
    this.grid.resetText();
  }

  save() {
    if (this.grid && this.grid.cells) {
      window.localStorage.setItem('puzzle', JSON.stringify(this.grid.cells));
    }
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
      this.grid.getMirrorCell(cell).toggleFill();
      this.grid.reset();
      return false;
    }
  }

  validateCell(cell) {
    if (!cell.value) return;
    cell.autocompleted = false;
    var c = cell.value.length - 1;
    while (c >= 0 && !cell.value.charAt(c).match(/\w/)) --c
    if (c < 0) cell.value = '';
    else cell.value = cell.value.charAt(c);
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
