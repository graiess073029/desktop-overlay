

export const specsFetch = async () => {

    const specs = JSON.parse(window.localStorage.getItem("specs") || "{}");

    if (!Object.keys(specs).length) {
        const specs = await window.api.getSpecs();
        window.localStorage.setItem("specs", JSON.stringify(specs));
        console.log("Specs Fetched successfully.")
    };

    return specs;

}