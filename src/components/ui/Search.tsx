import React, { useState } from "react";
import { useOrrery } from "../../contexts/OrreryContext";

const Search: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchMobile, setShowSearchMobile] = useState(false);
  const { bodies } = useOrrery();

  const searchResults = searchQuery
    ? bodies._all
        .filter((item) =>
          item.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter(
          (item) => item.bodyType !== "Asteroid" && item.bodyType !== "Comet"
        )
        .slice(0, 12)
    : null;

  const updateSearchQuery = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      // TODO: Handle search selection
    } else {
      setSearchQuery(e.currentTarget.value);
    }
  };

  return (
    <div className={`search-desktop ${searchResults ? "active" : ""}`}>
      <button
        type="button"
        className={`btn btn-rounded d-lg-none ${
          showSearchMobile ? "active" : ""
        }`}
        onClick={() => setShowSearchMobile(!showSearchMobile)}
      >
        <i className="fas fa-search"></i>
      </button>
      <div data-selector="search" className="search d-none d-lg-block">
        <i className="fas fa-search"></i>
        <input
          className="form-control input-search"
          type="search"
          placeholder="Search"
          onKeyUp={updateSearchQuery}
        />
      </div>
      <div className="search-results-container">
        <div data-selector="search" className="search-results">
          <input
            id="input-search-mobile"
            className={`d-lg-none form-control input-search-mobile ${
              showSearchMobile ? "active" : ""
            }`}
            type="search"
            placeholder="Search"
            onKeyUp={updateSearchQuery}
          />
        </div>
        <div className={`search-dropdown ${searchResults ? "active" : ""}`}>
          <ul>
            {searchResults?.map((result, i) => (
              <li key={i}>
                <a href={`/#/${result.id}`} onClick={(e) => e.preventDefault()}>
                  <span className="text-name">{result.displayName}</span>
                  <sub className="text-type">{result.bodyType}</sub>
                </a>
              </li>
            ))}
            {searchResults && searchResults.length === 0 && (
              <li>
                <span className="no-results">No results found.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Search;
