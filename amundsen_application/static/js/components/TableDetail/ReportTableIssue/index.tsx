import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { GlobalState } from 'ducks/rootReducer';

import LoadingSpinner from 'components/common/LoadingSpinner';
import { createIssue } from 'ducks/issue/reducer'; 
import { CreateIssueRequest } from 'ducks/issue/types';
import './styles.scss';
import { REPORT_DATA_ISSUE_TEXT, TABLE_OWNERS_NOTE } from './constants'; 
import { logClick } from 'ducks/utilMethods';
import { notificationsEnabled, issueTrackingEnabled } from 'config/config-utils';
import { TableMetadata, CreateIssuePayload, NotificationPayload, NotificationType } from 'interfaces';

export interface ComponentProps {
  tableKey: string;
  tableName: string;
}

export interface DispatchFromProps {
  createIssue: (
    createIssuePayload: CreateIssuePayload, 
    notificationPayload: NotificationPayload
    ) => CreateIssueRequest;
}

export interface StateFromProps {
  isLoading: boolean;
  tableOwners: string[]; 
  userEmail: string; 
  tableMetadata: TableMetadata; 
}

interface ReportTableIssueState {
  isOpen: boolean; 
}

export type ReportTableIssueProps = StateFromProps & DispatchFromProps & ComponentProps

export class ReportTableIssue extends React.Component<ReportTableIssueProps, ReportTableIssueState> {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  submitForm = (event) => {
    logClick(event);
    event.preventDefault();
    const form = document.getElementById("report-table-issue-form") as HTMLFormElement;
    const formData = new FormData(form);
   
    const createIssuePayload = this.getCreateIssuePayload(formData); 
    const notificationPayload = this.getNotificationPayload(); 
    this.props.createIssue(createIssuePayload, notificationPayload);
    this.setState({isOpen: false }); 
  };

  getCreateIssuePayload = (formData: FormData): CreateIssuePayload => {
    const title = formData.get('title') as string;  
    const description = formData.get('description') as string;

    return {
      title, 
      description, 
      key: this.props.tableKey, 
    }
  }

  getNotificationPayload  = (): NotificationPayload => {
    const { cluster, database, schema, name } = this.props.tableMetadata;
    const owners = this.props.tableOwners;
    const resourceName = `${schema}.${name}`;  
    const resourcePath = `/table_detail/${cluster}/${database}/${schema}/${name}`; 
     
    return {
      recipients: owners, 
      sender: this.props.userEmail, 
      notificationType: NotificationType.DATA_ISSUE_REPORTED, 
      options: {
        resource_name: resourceName, 
        resource_path: resourcePath, 
      }
    };
  }

  toggle = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };
  
  renderPipe = () => {
    if (notificationsEnabled()) {
      return ' | '; 
    }
    return ''; 
  } 

  render() {
    if (!issueTrackingEnabled()) {
      return ''; 
    }
    
    if (this.props.isLoading) {
      return <LoadingSpinner />;
    }
    return (
        <>
         {this.renderPipe()}
          <a href="javascript:void(0)"
             className="report-table-issue-link"
             onClick={this.toggle}
          >
           { REPORT_DATA_ISSUE_TEXT }
          </a>
          {
            this.state.isOpen &&
            <div className="report-table-issue-modal">
              <h3 className="data-issue-header">
                { REPORT_DATA_ISSUE_TEXT }
              </h3>
              <button type="button" className="btn btn-close" aria-label={"close"} onClick={this.toggle} />
              <form id="report-table-issue-form" onSubmit={ this.submitForm }>
                <div className="form-group">
                  <label>Title</label>
                  <input name="title" className="form-control" required={true} maxLength={200} />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" className="form-control" rows={5} required={true} maxLength={2000}/>
                </div>
                <button className="btn btn-primary submit" type="submit" >Submit</button>
              </form>
              <div className="data-owner-notification">
                {TABLE_OWNERS_NOTE}
              </div>
            </div>
          }
      </>
    );
  }
}
export const mapStateToProps = (state: GlobalState) => {
  const ownerObj = state.tableMetadata.tableOwners.owners; 
  const tableOwnersEmails = Object.keys(ownerObj); 
  const userEmail = state.user.loggedInUser.email;
  return {
    userEmail,
    isLoading: state.issue.isLoading, 
    tableOwners: tableOwnersEmails, 
    tableMetadata: state.tableMetadata.tableData
  };
};

export const mapDispatchToProps = (dispatch: any) => {
  return bindActionCreators({ createIssue } , dispatch);
};

export default connect<StateFromProps, DispatchFromProps, ComponentProps>(mapStateToProps, mapDispatchToProps)(ReportTableIssue);
