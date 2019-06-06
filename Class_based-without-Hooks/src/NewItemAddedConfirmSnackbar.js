import React, { Component } from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MySnackbarContent from "./MySnackbarContent";
import { withStyles } from "@material-ui/core";
import PropTypes from "prop-types";

const styles = theme => ({
  margin: theme.spacing.unit * 4
});

class NewItemAddedConfirmSnackbar extends Component {
  state = {
    vertical: "top",
    horizontal: "center"
  };

  render() {
    const {
      classes,
      openNewItemAddedConfirmSnackbar,
      closeNewItemConfirmSnackbar,
      noOfNewStoryAfterPolling
    } = this.props;
    return (
      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "center"
        }}
        open={openNewItemAddedConfirmSnackbar}
        onClose={closeNewItemConfirmSnackbar}
        ContentProps={{
          "aria-describedby": "message-id"
        }}
        style={{ marginTop: "35px" }}
      >
        <MySnackbarContent
          onClose={closeNewItemConfirmSnackbar}
          variant="success"
          className={classes.margin}
          message={`${noOfNewStoryAfterPolling} new story posted`}
        />
      </Snackbar>
    );
  }
}

NewItemAddedConfirmSnackbar.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(NewItemAddedConfirmSnackbar);

// autoHideDuration={12000}
