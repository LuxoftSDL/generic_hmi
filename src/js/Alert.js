import React from 'react';

import {AlertStrings} from './containers/Metadata'
import {AlertButtons} from './containers/Buttons';
import Image from './Templates/Shared/Image'
import StaticIcon from './Templates/Shared/StaticIcon'
import store from './store.js'
import { alertTimeoutReseted } from './actions'
import UIController from './Controllers/UIController'
import TTSController from './Controllers/TTSController'

export default class Alert extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            alertChecked: true,
            alertCounter: 5,
            ifSpeak: true,
            speakChecked: true,
            speakCounter: 5
        }
        this.pressResetTimeoutButton = this.pressResetTimeoutButton.bind(this);
    }

    pressResetTimeoutButton(event) { 
        store.dispatch(alertTimeoutReseted(true));

        let count = store.getState().ui[store.getState().activeApp].resetTimeout.resetTimeoutValue/1000;
        if (this.state.speakChecked) {
            this.setState({speakCounter: count});
            TTSController.resetSpeakTimeout()
        }
        if (this.state.alertChecked) {
            this.setState({alertCounter: count});
            UIController.resetAlertTimeout()
        }        
        
        // if (this.state.alertChecked && this.state.speakChecked) {
        //     this.setState({alertCounter: count});
        //     this.setState({speakCounter: count})
        //     Controller.resetAlertTimeout()
        // } else if (this.state.alertChecked) {
        //     this.setState({alertCounter: count});
        //     this.setState({speakCounter: ''}); 
        //     Controller.resetAlertTimeout()
        // } else if (this.state.speakChecked) {
        //     this.setState({alertCounter: ''});
        //     this.setState({speakCounter: count});
        //     store.dispatch(alertTimeoutReseted({appID: store.getState().activeApp})); 
        //     Controller.resetAlertTimeout()
        // }
        
    }
    changeCounter() {
        this.setState(prevState => ({alertCounter: prevState.alertCounter > 0 ? prevState.alertCounter - 1 : ''}))
        this.setState(prevState => ({speakCounter: prevState.speakCounter > 0 ? prevState.speakCounter - 1 : ''}))
    }
    componentDidMount() {
        this.interval = setInterval(() => this.changeCounter(), 1000)
    }
    componentWillUnmount() {
        clearInterval(this.interval)
    }

    
    render() {
        var fill = this.props.theme ? "#FFFFFF" : "#000000";
        var icon = this.props.icon ? this.props.icon : { imageType: "STATIC", value: "0xFE" }

        var iconElement = (icon.imageType === "STATIC")
                 ? (<StaticIcon class="alert-icon" image={icon.value} />)
                 : (<div className="alert-icon"><Image class="icon" image={icon.value} isTemplate={icon.isTemplate} fillColor={fill} /></div>);

        let speakCheckbox = undefined;
        if (store.getState().ui[store.getState().activeApp].alert.alertType == "BOTH") {
            speakCheckbox = (
                <>
                    <p>
                    <input
                        name="Speak" 
                        type="checkbox"
                        defaultChecked={this.state.speakChecked}
                        onChange={() => this.setState(prevState => ({speakChecked: !prevState.speakChecked}))} />
                    <label>Speak</label>
                    </p>
                </>
            );
        }

        let alertCheckbox = (
            <>
                <p>
                <input
                    name="Alert" 
                    type="checkbox"
                    defaultChecked={this.state.alertChecked}
                    onChange={() => this.setState(prevState => ({alertChecked: !prevState.alertChecked}))} />
                <label>Alert</label>
                </p>
            </>
        );

        let resetTimeoutHTML = undefined;        
        if (store.getState().ui[store.getState().activeApp].alert.softButtons == undefined) {
            let resetSpeakTimeoutHTML = undefined;

            if (speakCheckbox && this.state.speakCounter > 0) {
                resetSpeakTimeoutHTML = <>
                    <p>TTS.Speak: {this.state.speakCounter}</p>
                    </>
            }

            resetTimeoutHTML = undefined;
            if (alertCheckbox && this.state.alertCounter > 0) {
                resetTimeoutHTML = <><div className="timeout-box">
                    <p>UI.Alert: {this.state.alertCounter}</p>
                    {resetSpeakTimeoutHTML}
                    </div>
                    <button className="reset-button" onClick={this.pressResetTimeoutButton}>Reset Timeout</button></>
            }
        }        

        return (
            <div className="alert">
                <div className="alert-title">
                    <p className="t-small t-light th-f-color">
                        {this.props.alertName}
                    </p>
                </div>
                <div className="alert-top">
                    <AlertStrings/>
                    { iconElement }
                </div>
                <AlertButtons classPrefix="alert"/>
                <div className="alert-reset-box">
                    <div className="checkItems">
                        {alertCheckbox}
                        {speakCheckbox}
                    </div>
                    {resetTimeoutHTML}
                </div>
            </div>
        )
    }
}