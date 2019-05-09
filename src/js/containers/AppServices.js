import { connect } from 'react-redux'
import AppServicesNav from '../AppServicesNav'

const mapStateToProps = (state) => {
    // Get registered services to know which to populate
    // mediaActive: true
    // navActive  : false
    console.log("AS container")
    console.log(state)
    if (!state.systemCapability["APP_SERVICES"] || 
        !state.systemCapability["APP_SERVICES"].appServices) {
        return {appServicesEnabled: false}
    }
    var services = state.systemCapability["APP_SERVICES"].appServices;
    var activeServices = {};

    for (var i in services) {
        var serviceRecord  = services[i].updatedAppServiceRecord;
        if (serviceRecord.serviceActive) { 
            var manifest = serviceRecord.serviceManifest
            var type = manifest.serviceType
            activeServices[type] = {
                name: manifest.serviceName,
                icon: manifest.serviceIcon,
            }
            if (type === "NAVIGATION") {
                activeServices[type].manifest = manifest.navigationServiceManifest
            } else if (type === "MEDIA") {
                activeServices[type].manifest = manifest.mediaServiceManifest
            } else if (type == "WEATHER") {
                activeServices[type].manifest = manifest.weatherServiceManifest
            }
        }
    }

    var appServiceEmpty = Object.keys(activeServices).length === 0 
        && activeServices.constructor === Object;
    
    return {
        appServicesEnabled : !appServiceEmpty,
        activeServices: activeServices
    }
}

const mapDispatchToProps = (dispatch) => {
    return {}
}

const AppServices = connect(
    mapStateToProps,
    mapDispatchToProps
)(AppServicesNav)

export default AppServices