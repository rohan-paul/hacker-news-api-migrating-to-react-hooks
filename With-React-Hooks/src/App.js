import React, { Component } from "react";
import { Route, BrowserRouter, Switch, Router } from "react-router-dom";
import history from "./history";
import NotFound from "./Components/NotFound/NotFound";
import AppDashBoard from "./Components/AppDashBoard";

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <Router history={history}>
          <div>
            <Switch>
              <Route path={"/"} component={AppDashBoard} />
              <Route component={NotFound} />
            </Switch>
          </div>
        </Router>
      </BrowserRouter>
    );
  }
}

export default App;
