import React, { Component } from "react";
import { Switch, Route } from "react-router-dom";
import NotFound from "../Components/NotFound/NotFound";

import DashBoard from "../Dashboard";

export class DashboardRoutes extends Component {
  render() {
    return (
      <div>
        <Switch>
          <Route exact path={"/"} component={DashBoard} />
          <Route component={NotFound} />
        </Switch>
      </div>
    );
  }
}

export default DashboardRoutes;

/*
          {console.log("TABLE STATE IS", JSON.stringify(this.state.tableState))}
          {console.log("FETCHED DATA IS ", this.state.fetchedData)}
          {console.log("CHANGED COLULM IS ", this.state.changedColumn)}
          {console.log("CHANGED DIRECTION IS ", this.state.direction)}
          {console.log("ORIGINAL FORMATTED DATA IS", dataForTableRendering)}
          {console.log("NEW FORMATTED  DATA IS ", renderedStoriesOnPage)}
          {console.log("PREV STORY IDS ", this.state.prevStoriesIds)}
          {console.log("AFTER 10 SEC DATA", storyIds.data.slice(0, 4))}

          {console.log(
          "SORT DIRECTION IS ",
          this.state.tableState &&
            this.state.tableState.columns &&
            this.state.tableState.columns[0].sortDirection
        )}
*/
