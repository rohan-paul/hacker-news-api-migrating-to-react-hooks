import React, { Component, useState, useEffect, useRef } from "react";
import axios from "axios";
import MUIDataTable from "mui-datatables";
import "./Dashboard.css";
import NewItemAddedConfirmSnackbar from "./NewItemAddedConfirmSnackbar";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
const isEqual = require("lodash.isequal");
const differenceWith = require("lodash.differencewith");
const omit = require("lodash.omit");

const getEachStoryGivenId = (id, index) => {
  return new Promise((resolve, reject) => {
    axios
      .get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      .then(res => {
        let story = res.data;
        // console.log("RESPONSE IS ", story);
        let result = omit(story, ["descendants", "time", "id", "type"]);
        // console.log("THIS STORY", result);
        // add the storyRank field since it does not exist yet
        // story.storyRank = storyRank;
        if (
          result &&
          Object.entries(result).length !== 0 &&
          result.constructor === Object
        ) {
          resolve(result);
        } else {
          reject(new Error("No data received"));
        }
      });
  });
};

const Dashboard = () => {
  const [prevStoriesIds, setPrevStoriesIds] = useState([]);
  const [fetchedData, setFetchedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tableState, setTableState] = useState({});
  const [
    openNewItemAddedConfirmSnackbar,
    setOpenNewItemAddedConfirmSnackbar
  ] = useState(false);
  const [noOfNewStoryAfterPolling, setNoOfNewStoryAfterPolling] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const onChangeRowsPerPage = rowsPerPage => {
    setRowsPerPage(rowsPerPage);
  };

  const closeNewItemConfirmSnackbar = () => {
    setOpenNewItemAddedConfirmSnackbar(false);
    axios
      .get("https://hacker-news.firebaseio.com/v0/newstories.json")
      .then(storyIds => {
        setPrevStoriesIds(storyIds.data.slice(0, 2));
        getAllNewStory(storyIds);
      });
  };

  const getAllNewStory = storyIds => {
    setIsLoading(true);
    let topStories = storyIds.data.slice(0, 2).map(getEachStoryGivenId);
    let results = Promise.all(topStories);
    results
      .then(res => {
        setFetchedData(res);
        setIsLoading(false);
      })
      .catch(err => {
        console.log(err);
      });
  };

  /*
    /newstories: Provides a list of up to 500 story IDs, the newest first.
  /item: On HackerNews, everything is an item. This could be a story, commend, job, even a poll.
  That means, that every time we fetch the newest stories from the API, we have to do at least two AJAX calls, to get all the information we need, and then update the state of the component.

Get the story IDs
Fetch the data for each of the stories
Set the state array with all of the fetched story objects */

  const usePrevious = value => {
    // console.log("ID VALUE IS - ", value);
    // The ref object is a generic container whose current property is mutable ...
    // ... and can hold any value, similar to an instance property on a class
    const ref = useRef();

    // Store current value in ref
    useEffect(() => {
      ref.current = value;
    }, [value]);

    // Return previous value (happens before update in useEffect above)
    return ref.current;
  };

  const fromPrevStoriesIds = usePrevious(prevStoriesIds);

  useEffect(() => {
    {
      /*console.log("PREV STORYIDS ", prevStoriesIds);*/
    }

    axios
      .get("https://hacker-news.firebaseio.com/v0/newstories.json")
      .then(storyIds => {
        console.log("STORY IDs FETCHED ", storyIds.data.slice(0, 2));

        setPrevStoriesIds(storyIds.data.slice(0, 2));
        getAllNewStory(storyIds);
      });
    const timer = setInterval(() => {
      axios
        .get("https://hacker-news.firebaseio.com/v0/newstories.json")
        .then(storyIds => {
          // Inside polling call
          //   console.log("AFTER 10 SEC DATA", storyIds.data.slice(0, 4));
          // If this new polling request after the set timeInterval, to the API, fetches different sets of story-IDs ONLY then I will set the state again and also show a snackbar. So the loader will ONLY show when there's a new story and so I am updating the table by setting state again, and calling the getAllNewStory function (and of-course, loader will also show when refreshing the page manually)
          console.log(
            "EQUAL: FALSE",
            !isEqual(fromPrevStoriesIds, storyIds.data.slice(0, 2))
          );

          if (!isEqual(fromPrevStoriesIds, storyIds.data.slice(0, 2))) {
            setPrevStoriesIds(storyIds.data.slice(0, 2));
            setNoOfNewStoryAfterPolling(
              differenceWith(
                prevStoriesIds.sort(),
                storyIds.data.slice(0, 2).sort(),
                isEqual
              ).length
            );
            getAllNewStory(storyIds);
            setOpenNewItemAddedConfirmSnackbar(true);

            // Inside polling call
          }
        });
    }, 10000);

    return () => {
      console.log("cleaning up");
      clearInterval(timer);
    };
  }, [rowsPerPage, noOfNewStoryAfterPolling]);

  // Conditionally set the value of 'renderedStoriesOnPage' to show to the page view by executing the below IIFE -  for formatting the dates from UTC to human-readeable fomat - getDataToRender()
  let renderedStoriesOnPage = [];
  const getDataToRender = (() => {
    renderedStoriesOnPage = fetchedData.map(i => {
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
      sortDirection: tableState
        ? tableState.columns && tableState.columns[0].sortDirection
        : null
    },

    {
      name: "score",
      sortDirection: tableState
        ? tableState.columns && tableState.columns[1].sortDirection
        : null
    },

    {
      name: "title",
      sortDirection: tableState
        ? tableState.columns && tableState.columns[2].sortDirection
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
  ];

  const options = {
    filter: true,
    selectableRows: false,
    filterType: "dropdown",
    responsive: "stacked",
    selectableRows: "multiple",
    rowsPerPage: tableState ? tableState.rowsPerPage : 10,
    onChangeRowsPerPage: onChangeRowsPerPage,
    activeColumn: tableState ? tableState.activeColumn : 0,
    onTableChange: (action, tableState) => {
      // console.log("taBLE STATE IS ", JSON.stringify(tableState));
      setTableState(tableState);
    }
  };

  return (
    <React.Fragment>
      {console.log("PREV STORY IDs --- ", fromPrevStoriesIds)}
      <div
        style={{
          marginLeft: "15px",
          marginTop: "80px",
          display: "flex",
          flexDirection: "row"
        }}
      >
        <h4 style={{ width: "400px", paddingRight: "15px" }}>
          Hacker News top 2
        </h4>
      </div>
      <div>
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
            title={"Hacker News API top 2 result"}
            data={renderedStoriesOnPage}
            columns={columnsOptions}
            options={options}
          />
        ) : null}
        <NewItemAddedConfirmSnackbar
          openNewItemAddedConfirmSnackbar={openNewItemAddedConfirmSnackbar}
          closeNewItemConfirmSnackbar={closeNewItemConfirmSnackbar}
          noOfNewStoryAfterPolling={noOfNewStoryAfterPolling}
        />
      </div>
    </React.Fragment>
  );
};

export default Dashboard;

/* A> Notes on Object.assign -
To Merge multiple sources
let a = Object.assign({foo: 0}, {bar: 1}, {baz: 2});
ChromeSamples.log(a);
Output => {foo: 0, bar: 1, baz: 2}

In my case above, the existing state object < this.state > itself is an object with ky-value pairs of each story's parameters. So, basically I have to just merge three objects
A> empty one {}
B> this.state
C> All the new story {fetchedData: res}
}

B> Using Promise.all(...) and chaining the update of the component’s state to the resulting Promise. This way, fetchNewStories will always wait until the data for all of the stories has been fetched, before updating the app’s state in one single call.
 */
