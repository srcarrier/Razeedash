import React from 'react';
import moment from 'moment';
import _ from 'lodash';
import { withTracker } from 'meteor/react-meteor-data';
import { Meteor } from "meteor/meteor";
import { Resources } from '../../../api/resource/resources';
import { ResourcesSingle } from './resourcesSingle';
import { Session } from "meteor/session";
import Blaze from "meteor/blaze";
import Moment from '/imports/ui/components/moment';

class ResourceKindConfigMap extends React.Component {
    render(){
        return (
            <div>
            </div>
        );
    }
}
class ResourceKindSecret extends React.Component {
    render(){
        return (
            <div>
            </div>
        );
    }
}

class ResourceKindDeployment extends React.Component {
    render(){
        return (<ResourceKindDeploymentType {...this.props} />);
    }
}
class ResourceKindDaemonSet extends React.Component {
    render(){
        return (<ResourceKindDeploymentType {...this.props} />);
    }
}

class ResourceKindDeploymentTypeContainersCard extends React.Component {
    render(){
        var containers = _.get(this.props, 'data.spec.template.spec.containers', []);
        return (
            <div className="card my-3">
                <h4 className="card-header text-muted">Containers</h4>
                <div className="card-body p-0">
                    <table className="table table-striped mb-0">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Image</th>
                                <th>Ports</th>
                                <th>Volume Mounts</th>
                                <th>Envs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {_.map(containers, (container)=>{
                                return (
                                    <tr>
                                        <td>{container.name}</td>
                                        <td>{container.image}</td>
                                        <td>
                                            {_.map(container.ports, 'containerPort').join(', ')}
                                            {_.get(container, 'ports', []).length == 0 &&
                                                <span>None</span>
                                            }
                                        </td>
                                        <td>
                                            {_.map(_.get(container, 'volumeMounts', []), (volumeMount)=>{
                                                return (
                                                    <div>
                                                        {volumeMount.name} - {volumeMount.mountPath}
                                                    </div>
                                                );
                                            })}
                                            {_.get(container, 'volumeMounts', []).length == 0 &&
                                            <span>None</span>
                                            }
                                        </td>
                                        <td className={container.env.length > 0 ? 'p-0' : ''}>
                                            {container.env.length > 0 &&
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th className="p-1">Name</th>
                                                        <th className="p-1">Value Type</th>
                                                        <th className="p-1">Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {_.map(container.env, (envObj)=>{
                                                        var valType = 'string';
                                                        var val = envObj.value;
                                                        if(envObj.valueFrom){
                                                            var firstObjName = _.keys(envObj.valueFrom)[0];
                                                            var firstObj = envObj.valueFrom[firstObjName];
                                                            valType = firstObjName;
                                                            if(_.includes(['configMapKeyRef', 'secretKeyRef'], firstObjName)){
                                                                val = `${firstObj.name}:${firstObj.key}`;
                                                            } else if(_.includes(['fieldRef'], firstObjName)){
                                                                val = `${firstObj.apiVersion}:${firstObj.fieldPath}`;
                                                            }
                                                        }
                                                        return (
                                                            <tr>
                                                                <td className="p-1">{envObj.name}</td>
                                                                <td className="p-1">{valType}</td>
                                                                <td className="p-1">{val}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                            }
                                            {container.env.length == 0 &&
                                                <span>None</span>
                                            }
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

class ResourceKindDeploymentTypeConditionsCard extends React.Component {
    render(){
        var conditions = _.get(this.props.data, 'status.conditions', []);
        return (
            <div class="card my-3">
                <h4 className="card-header text-muted">
                    <i className="fa fa-heartbeat" aria-hidden="true"></i> Conditions
                </h4>
                <div class="card-body p-0">
                    <table className="table table-striped mb-0">
                        <thead>
                        <tr>
                            <th>Type</th>
                            <th>Status</th>
                            <th>Last Update</th>
                            <th>Message</th>
                            <th>Reason</th>
                        </tr>
                        </thead>
                        <tbody>
                            {_.map(conditions, (condition)=>{
                                return (
                                    <tr>
                                        <td>{condition.type}</td>
                                        <td>{condition.status}</td>
                                        <td>
                                            <Moment datetime={condition.lastUpdateTime}/>
                                        </td>
                                        <td>{condition.message}</td>
                                        <td>{condition.reason}</td>
                                    </tr>
                                );
                            })}
                            {conditions.length <= 0 &&
                                <tr>
                                    <td colSpan="5"> No conditions</td>
                                </tr>
                            }
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}

class ResourceKindDeploymentTypeReplicasCard extends React.Component{
    render(){
        var kind = this.props.data.kind;
        var data = this.props.data;
        var attrs = [
            { name: 'Defined', attrPath: 'spec.replicas', },
            { name: 'Available', attrPath: 'status.availableReplicas', },
            { name: 'Current', attrPath: 'status.replicas', },
            { name: 'Updated', attrPath: 'status.updatedReplicas', },
        ];
        if(_.includes(['DaemonSet'], kind)){
            attrs = [
                { name: 'Defined', attrPath: 'status.desiredNumberScheduled' },
                { name: 'Available', attrPath: 'status.currentNumberScheduled' },
                { name: 'Updated', attrPath: 'status.numberReady' },
            ];
        }

        _.each(attrs, (attrObj)=>{
            attrObj.val = _.get(data, attrObj.attrPath, '--');
        });
        return (
            <div class="card mb-3">
                <h4 class="card-header text-muted">
                    <i className="fa fa-files-o" aria-hidden="true"></i> Replicas
                </h4>
                <div class="card-body">
                    <div class="d-flex justify-content-around">
                        {_.map(attrs, (attrObj)=>{
                            return (
                                <div class="d-flex flex-column text-center">
                                    <div>{attrObj.val}</div>
                                    <small class="text-muted">{attrObj.name}</small>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

var ResourceKindDeploymentType =  withTracker((props)=>{
    console.log(2222, props)
    var deploymentName = props.resource.searchableData.name;

    var subs = [
        Meteor.subscribe('resources.recent', Session.get('currentOrgId')),
    ];
    var recentDeployments = Resources.find({}, { sort: { 'updated': -1 }, limit: 10 }).fetch();
    var isLoading = _.some(subs, (sub)=>{
        return !sub.ready();
    });
    return {
        deploymentName,
        recentDeployments,
        isLoading,
        ...props,
    };
})(class extends React.Component {
    render(){
        console.log(11111, this.props)

        return (
            <div>
                <ResourceKindDeploymentTypeContainersCard {...this.props} />
                <ResourceKindDeploymentTypeConditionsCard {...this.props} />

                <div class="row">
                    <div class="col-4">
                        <ResourceKindDeploymentTypeReplicasCard {...this.props} />
                    </div>
                </div>

            </div>
        );
    }
});



export default {
    ConfigMap: ResourceKindConfigMap,
    Secret: ResourceKindSecret,
    DaemonSet: ResourceKindDaemonSet,
    Deployment: ResourceKindDeployment,
};