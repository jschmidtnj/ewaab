import { toast } from 'react-toastify';
import React, { useEffect, useRef } from 'react';
import { useRouter } from 'next/dist/client/router';
import places from 'places.js';

interface LocationSelectArgs {
  onChange: (locationName: string, location?: string) => void;
  defaultLocation: string;
  disabled: boolean;
};

const LocationSelect = (args: LocationSelectArgs): JSX.Element => {
  const locationRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // handle places api
    const autocomplete = places({
      container: locationRef.current,
      appId: process.env.NEXT_PUBLIC_PLACES_APP_ID,
      apiKey: process.env.NEXT_PUBLIC_PLACES_API_KEY,
      language: router.locale,
    });
    autocomplete.on('change', (evt) => {
      const locationName = evt.suggestion.value;
      const locationVal = `${evt.suggestion.latlng.lat},${evt.suggestion.latlng.lng}`;
      args.onChange(locationName, locationVal);
    });
    autocomplete.on('clear', () => {
      args.onChange('', '');
    })
    autocomplete.on('error', (err) => {
      toast(err.message, {
        type: 'error',
      });
    });

    if (args.defaultLocation.length > 0) {
      args.onChange(args.defaultLocation);
    }

    return () => {
      autocomplete.removeAllListeners('change');
      autocomplete.removeAllListeners('error');
      autocomplete.removeAllListeners('clear');
    };
  }, []);

  return (
    <div>
      <label
        htmlFor="locationName"
        className="block text-sm font-medium text-gray-700"
      >
        Location
      </label>
      <div className="mt-2 flex rounded-md shadow-sm">
        <input
          type="text"
          name="locationName"
          id="locationName"
          defaultValue={args.defaultLocation}
          ref={locationRef}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block sm:text-sm border-gray-300 rounded-md"
        />
      </div>
    </div>
  );
};

export default LocationSelect;
