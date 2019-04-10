import React from 'react';

const Navbar = (props) => {
  const { changeView, view } = props;
  return (
    <div>
      <nav className="navbar fixed-top navbar-dark bg-dark">
        <a href="#!" onClick={() => {changeView('home')}} className="navbar-brand">Band Together</a>
        <div class="dropdown show">
          <a class="btn btn-secondary dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
             {view}
            </a>

          <div class="dropdown-menu" aria-labelledby="dropdownMenuLink">
            <a className="dropdown-item" onClick={() => { changeView('home') }} href="#!">Home</a>
            <a className="dropdown-item" onClick={() => { changeView('profile') }} href="#!">Profile</a>
            <a className="dropdown-item" onClick={() => { changeView('login') }} href="#!">Login</a>
          </div>
        </div>  
      </nav>
    </div>
  )
}

export default Navbar;
