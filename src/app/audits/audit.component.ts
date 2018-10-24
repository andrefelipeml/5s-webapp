import { Component, OnInit, ViewChild } from '@angular/core';
import { Audit } from './audit';
import { AuditService } from './audit.service';
import { EnviromentService } from '../enviroments/enviroment.service';
import { Enviroment } from '../enviroments/enviroment';
import { User } from '../users/user';
import { Unit } from '../units/unit';
import { UserService } from '../users/user.service';
import * as moment from 'moment';
import { IOption } from 'ng-select';
import { defineLocale, PageChangedEvent } from 'ngx-bootstrap';
import { ptBrLocale } from 'ngx-bootstrap/locale';
import swal from 'sweetalert';
import { NgForm } from '@angular/forms';
import { UnitService } from '../units/unit.service';
import { Evaluation } from './evaluation'
import { EvaluationService } from '../evaluations/evaluation.service';
import { SaveEvaluationDto } from './save-evaluation-dto';
import { SaveAuditDto } from './save-audit-dto';

@Component({
  selector: 'app-audit',
  templateUrl: './audit.component.html'
})

export class AuditComponent implements OnInit {
  
  message = {
   emptyMessage: 'Nenhum ambiente disponivel',
   totalMessage: 'Total',
   selectedMessage: 'Selecionados'
  }
  
  audit: Audit = new Audit();
  auditOld: Audit = new Audit();

  saveAudit: SaveAuditDto;
  evaluations = new Array<Evaluation>();
  enviroments: Enviroment[];
  enviromentsList: Enviroment[];
  
  users: User[];
  user_selected: number = -1;
  
  selected = [];

  isMultiple: boolean = true;
  audits: Audit[] = new Array<Audit>();
  period: Date[];
  units: Unit[];
  selectItems: Array<IOption> ;
  selectedEnviroment: Array<string> = [];

  //Filter and pagination
  auditFiltered: Audit[];
  lengthAuditsPagination: number;
  @ViewChild('auditForm') auditForm : NgForm;

  constructor(private auditService: AuditService,
    private _userService: UserService,
    private _enviromentService: EnviromentService,
    private _evaluationService: EvaluationService,
    private _unitService: UnitService) {
    moment.locale('pt-BR');
    defineLocale('pt-br', ptBrLocale);

  }

  ngOnInit() {

    moment.locale('pt-br');
    this.loadUsers();
    this.loadUnits();
    this.load();
  }

  /**
   * Adiciona a lista de avaliações e remove o ambiente da lista de ambientes
   */
  createEvaluation(){
    this.selected.forEach((environment : Enviroment) => {
      this.evaluations.push(new Evaluation(new Enviroment(environment.id, 
                                                          environment.block, 
                                                          environment.description,
                                                          environment.name,
                                                          environment.enviroment_types_id,
                                                          environment.units_id,
                                                          environment.users_id), 
                                           new User(this.users[this.user_selected].id, 
                                           this.users[this.user_selected].name)));
      this.enviromentsList = this.enviromentsList.filter( env => env != environment);
      this.selected = [];
    });
    this.user_selected = -1;
  }

  /**
   * Remove a avaliação e adiciona o ambiente da avaliação excluida a lista de ambientes disponiveis
   * @param i index no array
   */
  removeEvaluation(i: number){
    const env = this.enviroments.find(env => env.id === this.evaluations[i].Enviroment.id);
    this.enviromentsList.push(new Enviroment(env.id,env.block, 
                                             env.description, 
                                             env.name, 
                                             env.enviroment_types_id, 
                                             env.units_id, 
                                             env.users_id));
    this.enviromentsList = this.enviromentsList.filter(x => x != null);
    this.evaluations.splice(i,1);
  }
  findAudits(typed: string) {
    this.auditFiltered = this.audits.filter(
      audit => audit.title.toLowerCase().includes(typed.toLowerCase()));
    this.lengthAuditsPagination = this.auditFiltered.length
  }

  load() {
    this.audits = [];
    this.auditService.load()
      .subscribe(
        audits => {
          console.log('retorno do banco', audits)
          audits.forEach(audit => {
            this.audits.push(new Audit(audit.title, 
                                       audit.Evaluations[0].Enviroment.Unit, 
                                       audit.Evaluations,
                                       audit.initial_date,
                                       audit.due_date,
                                       audit.description,
                                       audit.status,
                                       audit.id));
          });
          this.audits = this.audits.filter(x => x != null);
          console.log('no componente', this.audits);
          this.auditFiltered = this.audits.slice(0, 10);
          this.lengthAuditsPagination = this.audits.length;
        },
        error => {
          console.log(error)
        },
    );
  }

   loadEnviromentsByUnit(unitId) {
      this._enviromentService.loadEnviromentsByUnit(unitId)
        .subscribe(enviroments => {
          this.enviroments = enviroments;
          this.enviromentsList = enviroments;
      });
   }

  loadUsers() {
    this._userService.load()
      .subscribe(users => {
        this.users = this.getAppraisers(users);
      })
  }

  loadUnits() {
    this._unitService.load()
      .subscribe(units => {
        this.units = units;
      })
  }

  getAppraisers(users) {
    return users.filter(
      user => user.profile == 2 ||
      user.profile == 3 ||
      user.profile == 6 || 
      user.profile == 7);   
  }

  save(audit: Audit) {
  //  this.evaluation.enviroments_id = this.selectedEnviroment;
    audit.initial_date = this.period[0];
    audit.due_date = this.period[1];
    
    audit.evaluations = this.evaluations;
   this.saveAudit = this.mapperSaveAudit(audit);
   this.audits = this.audits.filter(x => x != null);
    if(!audit.id){
      audit.status = 0;
      this.auditService.save(this.saveAudit)
        .subscribe(res => {
          this.getValidation(res);
          this.saveAudit.id = res['auditId'];
            this.saveAudit.evaluations.forEach( env => {
              env.audits_id = this.saveAudit.id;
            });
          this._evaluationService.save(this.saveAudit)
            .subscribe(res => {
              this.enviromentsList = [];
            });
          this.auditForm.reset();
          this.load();
        })
    } else {
      this.auditService.update(this.saveAudit)
      .subscribe(res => {
        this.getValidation(res);
        this.auditForm.reset();
        this.validadeUpdateEvaluations(this.audit.evaluations);
          this.saveAudit.evaluations.forEach( env => {
            env.audits_id = this.saveAudit.id;
          });

        this._evaluationService.save(this.saveAudit)
          .subscribe(res => {
            this.enviromentsList = [];
          });
        this.load();
      });
    }
  }

  validadeUpdateEvaluations(evaluations: Array<Evaluation>){
    let newEvaluation = [];
    let updateEvaluation = [];
    let deleteEvaluation = [];
    evaluations.forEach(evaluation => {
      let env  = this.auditOld.evaluations.find(envOld => envOld.id === evaluation.id);
      if(!env){
        newEvaluation.push(env);
      } else if(env.Enviroment.id != evaluation.Enviroment.id || env.User.id !== evaluation.User.id) {
        updateEvaluation.push(env);
      } else {
        deleteEvaluation.push(env);
      }
    });
    console.log('newEvaluation',newEvaluation);
    console.log('updateEvaluation',updateEvaluation);
    console.log('deleteEvaluation',deleteEvaluation);

  }

  async update(audit: Audit): Promise<void> {
      this.audit = audit;
      this.auditOld = audit;
      this.evaluations = audit.evaluations;
      //this.evaluation.users_id = audit.users_id; 
      this.audit.unit.id  = audit.unit.id;
      //moment.locale('pt-BR');
      await this.loadEnviromentsByUnit(audit.unit.id);
      this.audit.evaluations.forEach(x =>{
        this.enviromentsList = this.enviromentsList.filter( env => env.id != x.Enviroment.id);
      })
      this.period = [moment(audit.initial_date).toDate(), moment(audit.due_date).toDate()];
      this.audit = audit;
     //this.selectedEnviroment.push(this.audit.enviroments_id.toString());
      window.scroll(0, 0);
  }

  mapperSaveAudit(audit: Audit): SaveAuditDto{
    let evaluations = new Array<SaveEvaluationDto>();
    this.evaluations.forEach( env => {
      evaluations.push(this.mapperSaveEvaluation(env));
    })
    return new SaveAuditDto(audit.title, 
                            audit.unit_id, 
                            evaluations,
                            audit.initial_date,
                            audit.due_date,
                            audit.description,
                            0,
                            audit.id)
  }

  mapperSaveEvaluation(evaluation: Evaluation): SaveEvaluationDto{
    return new SaveEvaluationDto(evaluation.id, evaluation.id, evaluation.Enviroment.id, evaluation.User.id);
  }

  getValidation(res) {
    swal({
      title: '',
      text: res["message"],
      icon: res["type"]
    });
  }

  getModalAnswer(auditId) {
    swal({
      title: 'Exclusão de auditoria',
      text: 'Tem certeza que deseja excluir a auditoria?',
      buttons: ['Cancelar', 'OK'],
      icon: 'warning',
      dangerMode: true,
    })
      .then((willDelete) => {
        if (willDelete)
          this.remove(auditId);
      });
  }

  pageChanged(event: PageChangedEvent): void {
    const startItem = (event.page - 1) * event.itemsPerPage;
    const endItem = event.page * event.itemsPerPage;
   // this.auditFiltered = this.audits.slice(startItem, endItem);
  }

  remove(id: number): void {
    this.auditService.remove(id)
    .subscribe((res) => {
      this.getValidation(res);
      this.load();
      this.auditForm.reset();
    },
      error => {
        this.getValidation(error.error)
      }
    );
  }

  @ViewChild('myTable') table: any;

  rows: any[] = [];
  expanded: any = {};
  timeout: any;


  onPage(event) {
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => {
      console.log('paged!', event);
    }, 100);
  }

  toggleExpandRow(row) {
    console.log('Toggled Expand Row!', row);
    this.table.rowDetail.toggleExpandRow(row);
  }

  onDetailToggle(event) {
    console.log('Detail Toggled', event);
  }

}