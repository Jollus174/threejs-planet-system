import React from "react";
import { OrreryProvider } from "./contexts/OrreryContext";
import { SunProvider } from "./contexts/SunContext";
import Scene from "./components/Scene";
import OrbitControls from "./components/OrbitControls";
import Sidebar from "./components/ui/Sidebar";
import Search from "./components/ui/Search";
import TimeControls from "./components/ui/TimeControls";
import Navigation from "./components/ui/Navigation";
import "./scss/styles.scss";

const App: React.FC = () => {
  return (
    <OrreryProvider>
      <SunProvider>
        <main id="app-orrery">
          <div className="loading-spinner-container">
            <div className="loading-spinner">
              <svg viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <path d="M15.542 1.487A21.507 21.507 0 00.5 22c0 11.874 9.626 21.5 21.5 21.5 9.847 0 18.364-6.675 20.809-16.072a1.5 1.5 0 00-2.904-.756C37.803 34.755 30.473 40.5 22 40.5 11.783 40.5 3.5 32.217 3.5 22c0-8.137 5.3-15.247 12.942-17.65a1.5 1.5 0 10-.9-2.863z"></path>
              </svg>
            </div>
            <figure className="progress-bar">
              <div id="bar"></div>
            </figure>
          </div>

          <div className="ui">
            <div className="ui-top">
              <div className="container-ui-top container-fluid">
                <div className="row">
                  <div className="col-10 offset-1 col-md-6 offset-md-3">
                    <Navigation />
                  </div>
                  <div className="col-search col-1 col-md-3 d-md-flex">
                    <Search />
                  </div>
                </div>
              </div>
            </div>
            <div className="ui-centre">
              <div className="ui-centre-container">
                <div id="renderers-container" className="renderers-container">
                  <Scene>
                    <OrbitControls />
                  </Scene>
                </div>
                <Sidebar />
              </div>
            </div>
            <div className="ui-bottom">
              <div className="container-fluid">
                <div className="row">
                  <div className="col-12">
                    <TimeControls />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </SunProvider>
    </OrreryProvider>
  );
};

export default App;
