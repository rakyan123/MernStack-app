async function getCoordsForAddress(address) {
    return {
        lat:40.7484474,
        lng:-73.9871516
    }
}

/*
async function getCoordsForAddress(address){
    const response = await axios.get(googleMapUrl);
    const data = response.data;

    if(!data || data.status === 'ZERO_RESULTS'){
        const error = new HttpError('Could not find location for the specified address.'.422);
        throw error;
    }

    const coordinates = data.results[0].geometry.location;
    return coordinates;
    

}*/
//Throw doesnt work correctly with async and so we should use next;

module.exports = getCoordsForAddress;