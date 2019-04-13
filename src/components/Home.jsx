import React from 'react';
import ListView from './ListView.jsx'
import Search from './Search.jsx';
import ListingForm from './ListingForm';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';


const popover = (
  <Popover id="popover-basic">
      Must be logged in to create a listing!
  </Popover>
)
class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Used to filter out listings by type
      filterGig: false,
      filterBand: false,
      filterMates: false,
      filterMember: false,
      // Used to sort listings
      sort: '',
      showForm: false,
      showSearch: false,
      city: '',
    };

    this.toggleForm = this.toggleForm.bind(this);
    this.toggleSearch = this.toggleSearch.bind(this);
  }

  toggleSearch() {
    const currentState = this.state.showSearch;
    this.setState({
      showSearch: !currentState,
    })
  }

  toggleForm() {
    const currentState = this.state.showForm;
    this.setState({
      showForm: !currentState,
    });
  }

  render() {
    const { listings, artists, isLoggedIn } = this.props;
    const { showForm, showSearch } = this.state;
    return (
      <div className="jumbotron">
        <div className="row">
          <div className="col-md-12">
            {!showSearch && <button className="btn btn-dark btn-lg btn-block" type="button" onClick={this.toggleSearch}>Search Settings</button>}
            {showSearch && <Search toggleSearch={this.toggleSearch}/>}
          </div>
        </div>
        {!isLoggedIn && (
          <OverlayTrigger trigger="click" placement="top" overlay={popover}>
            <button className="btn btn-dark btn-lg btn-block" type="button">Create a Listing</button>
          </OverlayTrigger>
        )}
        {isLoggedIn && 
          ((!showForm && <button className="btn btn-dark btn-lg btn-block" type="button" onClick={this.toggleForm}>Create a Listing</button>)
          ||
          (showForm && <ListingForm toggleForm={this.toggleForm} />))
        }
        <div className="row">
          <ListView isLoggedIn={isLoggedIn} listings={listings} artists={artists}/>
        </div>
      </div>
    )
  }
}


export default Home;
