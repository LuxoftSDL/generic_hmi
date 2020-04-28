import RpcFactory from './RpcFactory'
import store from '../store'
import { activateApp, setURLS, setPTUWithModem, clearPendingAppLaunch } from '../actions'
import bcController from './BCController'
import externalPolicies from './ExternalPoliciesController'
import FileSystemController from './FileSystemController'

import {flags} from '../Flags'
var activatingApplication = 0
class SDLController {
    constructor () {
        this.addListener = this.addListener.bind(this)
        this.handleRPCError = this.handleRPCError.bind(this)
        var incrementedRpcId = 5012
        var rpcAppIdMap = {}
        
        //ToDo: Add ExternalConsentStatus View
        //Sample struct used below
        /*this.externalConsentStatus = [{
            entityType: 1, entityID: 1, status: "ON"
        }, 
        {
            entityType: 1, entityID: 2, status: "OFF"
        }];*/
        this.externalConsentStatus = [];
        store.dispatch(setPTUWithModem(flags.PTUWithModemEnabled))
    }
    addListener(listener) {
        this.listener = listener
    }
    handleRPC(rpc) {
        let methodName = rpc.method.split(".")[1]
        switch (methodName) {
            case "OnStatusUpdate":
                if(rpc.params.status === "UP_TO_DATE") {
                    if(flags.ExternalPolicies) {
                        externalPolicies.stopUpdateRetry();
                    }                    
                }
                return null;
            default:
                return null
        }
    }
    handleRPCResponse(rpc) {
        let methodName = rpc.result.method.split(".")[1]
        switch (methodName) {
            case "ActivateApp":
                store.dispatch(clearPendingAppLaunch());
                if(rpc.result.isPermissionsConsentNeeded) {
                    this.getListOfPermissions(activatingApplication)
                }
                if(!rpc.result.isSDLAllowed) {
                    //bcController.getUserFriendlyMessages("DataConsent", "AllowSDL", activatingApplication)
                    bcController.onAllowSDLFunctionality(true, "GUI")
                } else {
                    store.dispatch(activateApp(activatingApplication))
                } 
                return;
            case "GetPolicyConfigurationData":
                var urls = JSON.parse(rpc.result.value[0])["0x07"]["default"];
                var parsed_urls = [];
                for (const url of urls) {
                    parsed_urls.push({'url': url});
                }
                store.dispatch(setURLS(parsed_urls))
                var state = store.getState()
                
                let regular_ptu_flow = () => {
                    if(flags.ExternalPolicies) {
                        externalPolicies.pack({            
                            requestType: 'PROPRIETARY',
                            fileName: state.system.policyFile,
                            urls: state.system.urls,
                            retry: state.system.policyRetry,
                            timeout: state.system.policyTimeout
                        })
                    } else {
                        bcController.onSystemRequest(state.system.policyFile, state.system.urls)
                    }
                };
                
                if(state.system.ptuWithModemEnabled){
                    console.log('PTU: Starting PTU over vehicle modem');
                    let switch_to_regular_ptu_flow = () => {
                        console.log('PTU: PTU over vehicle modem failed. Switching to PTU over mobile')
                        store.dispatch(setPTUWithModem(false))
                        regular_ptu_flow()
                    };

                    var that = this;
                    if(FileSystemController.isConnected()){
                        FileSystemController.requestPTUFromEndpoint(state.system.policyFile, state.system.urls[0]['url']).then((policyFile) => {
                            that.onReceivedPolicyUpdate(policyFile);
                        }, switch_to_regular_ptu_flow);
                    }
                    else{
                        switch_to_regular_ptu_flow()
                    }
                }
                else{
                    console.log('PTU: Starting PTU over mobile')
                    regular_ptu_flow()
                }
                return;
            case "GetListOfPermissions":         
                //To Do: Implement permission view. For now all permissions are consented
                var allowedFunctions = rpc.result.allowedFunctions
                for (var index in allowedFunctions) {
                    if(!allowedFunctions[index].allowed) {
                        allowedFunctions[index].allowed = true
                    }
                }
                this.onAppPermissionConsent(allowedFunctions, this.externalConsentStatus)
                return;
        }
    }
    handleRPCError(rpc) {
        let methodName = rpc.error.data.method.split(".")[1]
        switch (methodName) {
            case "ActivateApp":
                store.dispatch(clearPendingAppLaunch())
                return;
        }
    }
    onAppActivated(appID) {
        // this.listener.send(RpcFactory.BCOnAppActivatedNotification(appID))
        activatingApplication = appID
        this.listener.send(RpcFactory.SDLActivateApp(appID))
    }
    getPolicyConfiguration(type, property) {
        this.listener.send(RpcFactory.GetPolicyConfigurationData(type, property));
    }
    onReceivedPolicyUpdate(policyFile) {
        this.listener.send(RpcFactory.OnReceivedPolicyUpdate(policyFile))
    }
    getListOfPermissions(appID) {
         this.listener.send(RpcFactory.GetListOfPermissions(appID))
    }
    onAppPermissionConsent(allowedFunctions, externalConsentStatus) {
        this.listener.send(RpcFactory.OnAppPermissionConsent(allowedFunctions, externalConsentStatus))
    }
}

let controller = new SDLController()
export default controller
