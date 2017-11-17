import { Component, OnInit, ViewChild } from '@angular/core';
import { MenuItem, DataTable, ConfirmationService, Message, LazyLoadEvent, DialogModule } from "primeng/primeng";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import Dexie from 'dexie';
import { Observable } from "rxjs";
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

const MAX_EXAMPLE_RECORDS = 1000;

@Component({
  selector: 'at-alltimes',
  templateUrl: './alltimes.component.html',
  styleUrls: ['./alltimes.component.css']
})
export class AlltimesComponent implements OnInit {

  @ViewChild("dt") dt : DataTable;

  allTimesheetData = [];

  addEntryForm: FormGroup;

  displayEntryForm = false;

  allProjectNames = ['', 'Payroll App', 'Mobile App', 'Agile Times'];

  allProjects = this.allProjectNames.map((proj) => {
    return { label: proj, value: proj }
  });

  selectedRows: Array<any>;

  contextMenu: MenuItem[];

  recordCount : number;

  display: boolean = false;
  messages: Message[] = [];
  
    constructor(private confirmationService: ConfirmationService, private apollo: Apollo, private fb: FormBuilder) {
  
    }
  ngOnInit() {
    this.addEntryForm = this.fb.group({
      User: ['', [Validators.required, Validators.minLength(0)]],
      Project: ['', [Validators.required, Validators.minLength(0)]],
      Category: ['', [Validators.required, Validators.minLength(0)]],
      StartTime: ['', [Validators.required, Validators.minLength(0)]],
      EndTime: ['', [Validators.required, Validators.minLength(0)]]
    })

    const AllClientsQuery = gql`
    query allTimesheets {
      allTimesheets {
          id
          user
          project
          category
          startTime
          endTime
        }
    }`;
    
    const queryObservable = this.apollo.watchQuery({

      query: AllClientsQuery,

      pollInterval:200


    }).subscribe(({ data, loading }: any) => {

      this.allTimesheetData = data.allTimesheets;
      this.recordCount = data.allTimesheets.length;

    });

  }
  cancelDialog() {
    
        this.confirmationService.confirm({
          header: 'Cancel Time Creation',
          message: 'Cancel all changes. Are you sure?',
          accept: () => {
            this.addEntryForm.reset();
            this.displayEntryForm = false;
            this.messages.push({ severity: 'info', summary: 'Edits Cancelled', detail: 'No changes were saved' });
          }
          ,
          reject: () => {
            this.messages.push({ severity: 'warn', summary: 'Cancelled the Cancel', detail: 'Please continue your editing' });
            console.log("False cancel. Just keep editing.");
          }
        });
    
    
      }
  saveNewEntry() {
        const user = this.addEntryForm.value.User;
        const project = this.addEntryForm.value.Project;
        const category = this.addEntryForm.value.Category;
        const startTime = this.addEntryForm.value.StartTime;
        const endTime = this.addEntryForm.value.EndTime;
    
        const createTimesheet = gql`
          mutation createTimesheet ($user: String!, $project: String!, $category: String!, $startTime: Int!, $endTime: Int!, $date: DateTime!) {
            createTimesheet(user: $user, project: $project, category: $category, startTime: $startTime, endTime: $endTime, date: $date ) {
              id
            }
          }
        `;
    
        this.apollo.mutate({
          mutation: createTimesheet,
          variables: {
            user: user,
            project: project,
            category: category,
            startTime: startTime,
            endTime: endTime,
            date: new Date()
          }
        }).subscribe(({ data }) => {
          console.log('Data added', data);
          this.addEntryForm.reset();
        }, (error) => {
          console.log('Error', error);
        });
        this.displayEntryForm = false;
        this.messages.push({ severity: 'success', summary: 'Entry Created', detail: 'Your entry has been created' });
      }
      hasFormErrors() {
        return !this.addEntryForm.valid;
      }
}