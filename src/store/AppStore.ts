import { action, computed, makeObservable, observable } from "mobx";
import EventEmitter from "events";
import UAParser from "ua-parser-js";

class AppStore {
    events: EventEmitter = new EventEmitter();
    sideOpened: boolean = false;

    toggleSide = action(() => {
        this.sideOpened = !this.sideOpened;
    });

    sideClose = action(() => {
        if (this.sideOpened) this.sideOpened = false;
    });

    get isMobile() {
        const userAgent = navigator.userAgent;
        const parser = new UAParser(userAgent);
        return parser.getDevice().type === "mobile";
    }

    get isTablet() {
        const userAgent = navigator.userAgent;
        const parser = new UAParser(userAgent);
        return parser.getDevice().type === "tablet";
    }

    constructor() {
        makeObservable(this, {
            isMobile: computed,
            sideOpened: observable,
            toggleSide: action
        });
        this.events.on("routeChange", this.sideClose);
    }
}

const appStore = new AppStore();
export default appStore;
