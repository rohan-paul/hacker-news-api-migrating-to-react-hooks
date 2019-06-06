import React, { Component } from "react";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import "./Dashboard.css";
import NewItemAddedConfirmSnackbar from "./NewItemAddedConfirmSnackbar";
const isEqual = require("lodash.isequal");
const differenceWith = require("lodash.differencewith");
const omit = require("lodash.omit");

const getEachStoryGivenId = (id, index) => {
  //   const storyRank = index + 1;
  return new Promise((resolve, reject) => {
    axios
      .get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      .then(res => {
        let story = res.data;
        let result = omit(story, ["descendants", "time"]);
        console.log("THIS STORY", result);
        // add the storyRank field since it does not exist yet
        // story.storyRank = storyRank;
        if (
          story &&
          Object.entries(story).length !== 0 &&
          story.constructor === Object
        ) {
          resolve(story);
        } else {
          reject(new Error("No data received"));
        }
      });
  });
};

export class Dashboard extends Component {
  state = {
    prevStoriesIds: [],
    fetchedData: [],
    isLoading: false,
    tableState: {},
    openNewItemAddedConfirmSnackbar: false,
    noOfNewStoryAfterPolling: 0,
    rowsPerPage: 10
  };

  onChangeRowsPerPage = rowsPerPage => {
    this.setState({ rowsPerPage });
  };

  closeNewItemConfirmSnackbar = () => {
    this.setState({ openNewItemAddedConfirmSnackbar: false }, () => {
      axios
        .get("https://hacker-news.firebaseio.com/v0/newstories.json")
        .then(storyIds => {
          this.setState(
            {
              prevStoriesIds: storyIds.data.slice(0, 20)
            },
            () => {
              this.getAllNewStory(storyIds);
            }
          );
        });
    });
  };

  getAllNewStory = storyIds => {
    this.setState({ isLoading: true }, () => {
      let topStories = storyIds.data.slice(0, 20).map(getEachStoryGivenId);
      let results = Promise.all(topStories);
      results
        .then(res => {
          this.setState(
            Object.assign({}, this.state, {
              fetchedData: res,
              isLoading: false
            })
          );
        })
        .catch(err => {
          console.log(err);
        });
    });
  };

  /*
    /newstories: Provides a list of up to 500 story IDs, the newest first.
  /item: On HackerNews, everything is an item. This could be a story, commend, job, even a poll.
  That means, that every time we fetch the newest stories from the API, we have to do at least two AJAX calls, to get all the information we need, and then update the state of the component.

Get the story IDs
Fetch the data for each of the stories
Set the state array with all of the fetched story objects */

  componentDidMount() {
    // After the component gets mounted for the first time, an API request is filed immediately. But subsequent requests are fired after each interval number of microseconds
    axios
      .get("https://hacker-news.firebaseio.com/v0/newstories.json")
      .then(storyIds => {
        this.setState(
          {
            prevStoriesIds: storyIds.data.slice(0, 20)
          },
          () => {
            this.getAllNewStory(storyIds);
          }
        );
      });
    this.timer = setInterval(() => {
      axios
        .get("https://hacker-news.firebaseio.com/v0/newstories.json")
        .then(storyIds => {
          console.log("AFTER 10 SEC DATA", storyIds.data.slice(0, 4));
          // If this new polling request after the set timeInterval, to the API, fetches different sets of story-IDs ONLY then I will set the state again and also show a snackbar. So the loader will ONLY show when there's a new story and so I am updating the table by setting state again, and calling the getAllNewStory function (and of-course, loader will also show when refreshing the page manually)
          if (
            !isEqual(
              this.state.prevStoriesIds.sort(),
              storyIds.data.slice(0, 20).sort()
            )
          ) {
            this.setState(
              {
                prevStoriesIds: storyIds.data.slice(0, 20),
                noOfNewStoryAfterPolling: differenceWith(
                  this.state.prevStoriesIds.sort(),
                  storyIds.data.slice(0, 20).sort(),
                  isEqual
                ).length
              },
              () => {
                this.getAllNewStory(storyIds);
                this.setState({
                  openNewItemAddedConfirmSnackbar: true
                });
              }
            );
          }
        });
    }, 100000);
  }

  componentDidUpdate(prevProps, prevState) {
    // After the component gets mounted for the first time, an API request is filed immediately. But subsequent requests are fired after each interval number of microseconds  - !isEqual(this.state.fetchedData.sort(), prevState.fetchedData.sort())

    if (
      this.state.rowsPerPage !== prevState.rowsPerPage ||
      !isEqual(this.state.prevStoriesIds, prevState.prevStoriesIds) ||
      this.state.noOfNewStoryAfterPolling !== prevState.noOfNewStoryAfterPolling
    ) {
      axios
        .get("https://hacker-news.firebaseio.com/v0/newstories.json")
        .then(storyIds => {
          this.setState(
            {
              prevStoriesIds: storyIds.data.slice(0, 20)
            },
            () => {
              this.getAllNewStory(storyIds);
            }
          );
        });
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer);
    this.timer = null;
  }

  render() {
    const { fetchedData, isLoading } = this.state;

    // Conditionally set the value of 'renderedStoriesOnPage' to show to the page view by executing the below IIFE -  for formatting the dates from UTC to human-readeable fomat - getDataToRender()
    let renderedStoriesOnPage = [];
    const getDataToRender = (() => {
      renderedStoriesOnPage = fetchedData.map(i => {
        i.time = new Date(i.time * 1000).toString();
        return Object.values(i);
      });
      return renderedStoriesOnPage;
    })();

    // const renderedStoriesOnPage =
    //   fetchedData.length !== 0 ? fetchedData.map(i => Object.values(i)) : null;

    // For each of the column its sortDirection property will come from the app state (if the user has already changed the table and sorted a column) ELSE its set to null.
    // So this is where the requirement "Persistent Sorting" should have been implemented - "On every poll the current sorting option should remain unchanged e.g. if user has sorted the list of stories based on score then that order should remain unchanged"  - But due to an open issue on the package [Table sort is lost if data changed on a re-render](https://github.com/gregnb/mui-datatables/issues/305) - sorting is not getting persisted.
    const columnsOptions = [
      {
        name: "Author",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[0].sortDirection
          : null
      },
      {
        name: "descendants",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[1].sortDirection
          : null
      },
      {
        name: "id",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[2].sortDirection
          : null
      },
      {
        name: "score",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[3].sortDirection
          : null
      },
      {
        name: "time",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[4].sortDirection
          : null
      },
      {
        name: "title",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[5].sortDirection
          : null
      },
      {
        name: "type",
        sortDirection: this.state.tableState
          ? this.state.tableState.columns &&
            this.state.tableState.columns[6].sortDirection
          : null
      },
      {
        name: "URL",
        options: {
          filter: false,
          customBodyRender: (value, tableMeta, updateValue) => {
            // console.log("TABLE META IS ", JSON.stringify(tableMeta));
            return (
              <a target="_blank" href={value}>
                {value}
              </a>
            );
          }
        }
      }
      //   { name: "storyRank" }
    ];

    const options = {
      filter: true,
      selectableRows: false,
      filterType: "dropdown",
      responsive: "stacked",
      selectableRows: "multiple",
      rowsPerPage: this.state.tableState
        ? this.state.tableState.rowsPerPage
        : 10,
      onChangeRowsPerPage: this.onChangeRowsPerPage,
      activeColumn: this.state.tableState
        ? this.state.tableState.activeColumn
        : 0,
      onTableChange: (action, tableState) => {
        // console.log("taBLE STATE IS ", JSON.stringify(tableState));
        this.setState({
          tableState: tableState
        });
      }
    };

    return (
      <React.Fragment>
        <div style={{ marginLeft: "25px", marginTop: "80px" }}>
          <h4>Hacker News top 2</h4>
        </div>

        {isLoading ? (
          <div className="interactions">
            <div className="lds-ring">
              <div />
              <div />
              <div />
              <div />
            </div>
          </div>
        ) : fetchedData.length !== 0 && renderedStoriesOnPage.length !== 0 ? (
          <MUIDataTable
            title={"Hacker News API top 20 result"}
            data={renderedStoriesOnPage}
            columns={columnsOptions}
            options={options}
          />
        ) : null}
        <NewItemAddedConfirmSnackbar
          openNewItemAddedConfirmSnackbar={
            this.state.openNewItemAddedConfirmSnackbar
          }
          closeNewItemConfirmSnackbar={this.closeNewItemConfirmSnackbar}
          noOfNewStoryAfterPolling={this.state.noOfNewStoryAfterPolling}
        />
      </React.Fragment>
    );
  }
}

export default Dashboard;

/* A> Notes on Object.assign -
To Merge multiple sources
let a = Object.assign({foo: 0}, {bar: 1}, {baz: 20});
ChromeSamples.log(a);
Output => {foo: 0, bar: 1, baz: 20}

In my case above, the existing state object < this.state > itself is an object with ky-value pairs of each story's parameters. So, basically I have to just merge three objects
A> empty one {}
B> this.state
C> All the new story {fetchedData: res}
}

B> Using Promise.all(...) and chaining the update of the component’s state to the resulting Promise. This way, fetchNewStories will always wait until the data for all of the stories has been fetched, before updating the app’s state in one single call.
 */
