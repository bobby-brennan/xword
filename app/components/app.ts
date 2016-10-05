import {Component, ApplicationRef} from '@angular/core';
import {Solver} from '../lib/solver';
import {Clue, Cell, ClueSet, Grid} from '../lib/grid';
import {DictionaryService} from '../services/dictionary';
declare let $: any;
declare let window: any;
declare let require: any;

const START_GRID = require('json!../saves/tetris.json');

@Component({
    selector: 'xword',
    template: `
        <navbar></navbar>
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
                <button class="btn btn-primary" (click)="solver.updateConstraints(); solver.step()" [disabled]="autocompleting">
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
              <label>Puzzle</label><br>
              <div class="btn-toolbar">
                <a class="btn btn-success fa fa-save" (click)="save()"></a>
                <div class="btn-group">
                  <a class="btn btn-danger fa fa-trash" (click)="reset()"></a>
                  <a class="btn btn-danger fa fa-font" (click)="resetText()"></a>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="alert" class="alert alert-{{alert.class}}">
            {{alert.text}}
          </div>
          <puzzle-grid [grid]="grid" [editMode]="editMode"></puzzle-grid>
          <div class="clues row">
            <div *ngFor="let clueSet of ['across', 'down']" class="col-xs-12 col-md-6">
              <h4 class="text-uppercase">{{ clueSet }}</h4>
              <div *ngFor="let clue of grid.clues[clueSet]" class="clue">
                <span class="clue-number">{{clue.number}}.</span>
                <a (click)="solver.autocomplete(clue)"
                      class="btn btn-sm {{!solver.getAutocompletion(clue) ? 'btn-danger' : 'btn-primary'}}">
                   <span class="fa fa-magic"></span>
                </a>
                <input type="text" size="1" [(ngModel)]="cell.value" class="clue-letter text-uppercase"
                     *ngFor="let cell of clue.cells"
                     (change)="clue.impossible = false; cell.autocompleted = false; cell.validate()"
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
    });
  }

  save() {
    window.localStorage.setItem('puzzle', this.grid.serialize());
  }

  maybeLoad() {
    var grid = window.localStorage.getItem('puzzle');
    if (!grid) return;
    try {
      return Grid.deserialize(grid);
    } catch (e) {
      console.log("Bad grid, trying old version");
      try {
        grid = JSON.parse(grid);
        return new Grid(grid.map(row => row.map(cell => new Cell(cell))))
      } catch (e) {
        console.log("Error loading puzzle", grid);
        console.log(e);
      }
    }
    return null;
  }

  reset(grid=null) {
    this.pauseAutocomplete();
    this.alert = null;
    if (grid) {
      this.grid = grid;
    } else {
      this.grid = Grid.deserialize(START_GRID);
    }
    this.solver = new Solver(this.dictionary, this.grid);
    this.solver.fillPrompts();
  }

  resetText() {
    this.alert = null;
    this.pauseAutocomplete();
    this.solver.steps = [];
    this.grid.resetText();
  }

  onKeyUp(event) {
    if (event.key === 'Backspace') $(':focus').prev().focus();
    else if (event.key.match(/[\w]/) && event.key.length === 1) $(':focus').next().focus();
  }

  startAutocomplete() {
    this.autocompleting = true;
    this.alert = {class: 'info', text: "Solving..."}
    this.solver.updateConstraints();
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
