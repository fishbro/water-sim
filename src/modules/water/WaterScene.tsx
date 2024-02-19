"use client";

import style from "./WaterScene.module.scss";
import React, { Component, RefObject } from "react";
import SceneConstructor from "modules/water/SceneConstructor";
import { action, makeObservable, observable } from "mobx";
import { observer } from "mobx-react";
import AppStore from "store/AppStore";

class WaterScene extends Component {
    frame: RefObject<HTMLDivElement>;
    view: SceneConstructor | null = null;
    loading: boolean = true;
    isMouseDragging: boolean = false;

    constructor(props: any) {
        super(props);

        makeObservable(this, {
            loading: observable
        });
        this.frame = React.createRef();
    }

    loadingDone = action(() => {
        this.loading = false;
    });

    componentDidMount() {
        const frame = this.frame.current;
        if (AppStore.isMobile) {
            return frame?.remove();
        }

        AppStore.events.on("houseLoadingDone", this.loadingDone);

        if (frame) {
            if (frame.children.length) frame.innerHTML = "";
            this.view = new SceneConstructor(frame);
        }
    }

    componentWillUnmount() {
        AppStore.events.off("houseLoadingDone", this.loadingDone);

        this.view?.destroy();
    }

    render() {
        return (
            <div
                className={style.scene}
                ref={this.frame}
            >
                loading...
            </div>
        );
    }
}

export default observer(WaterScene);
