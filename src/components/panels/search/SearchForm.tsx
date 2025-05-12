
import React from 'react';
import SearchInput from './SearchInput';
import DatePicker from './DatePicker';
import PeriodSelector from './PeriodSelector';

interface SearchFormProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  isSearching: boolean;
  handleSearch: (location: string) => Promise<void>;
}

const SearchForm: React.FC<SearchFormProps> = ({
  searchLocation,
  setSearchLocation,
  isSearching,
  handleSearch
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
      <SearchInput
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        isSearching={isSearching}
        handleSearch={handleSearch}
      />
      <DatePicker />
      <PeriodSelector />
    </div>
  );
};

export default SearchForm;
