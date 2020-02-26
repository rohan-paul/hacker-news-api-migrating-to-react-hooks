#### [LIVE Demo]


#### To launch this project in the local machine.

``npm i`` and then ``npm start``

#### What this little project do

It picks 20 new articles from the **HackerNews stories API endpoint**

Show loader till stories are ready to be displayed

For rendering the table, I implemented the package mui-datatable, where you can do sort by each heading (score, title, author), all kind of multi-parameter filtering

Poll periodically (every 1 mint) and show a count of number of new stories since last poll.

Pagination by showing a dropdown option for limiting the number of stories shown on the screen e.g. 5, 10 and 20.


#### Existing Issue

 - 1. I wanted to implement this functionality - On every poll the current sorting option should remain unchanged e.g. if user has sorted the list of stories based on score then that order should remain unchanged" - Is not entirely met. So while during the polling API call after the time-interval will not hamper the sorting order, but after I receive a new story, the sorting order will not remain preserved.

#### And there's an open issue on this package (mui-datatable) for the exact same problem
[Table sort is lost if data changed on a re-render](https://github.com/gregnb/mui-datatables/issues/305)