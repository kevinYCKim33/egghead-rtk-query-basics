// https://egghead.io/courses/rtk-query-basics-query-endpoints-data-flow-and-typescript-57ea3c43
// TYPE git tag to see the app evolve from fake data to real data to redux

import React from "react";
import ReactDOM from "react-dom/client";
import {
  ApiProvider,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";

interface PokemonListing {
  count: number;
  results: Array<{
    name: string;
    url: string;
  }>;
}

interface PokemonDetailData {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }>;
  sprites: {
    front_default: string;
  };
}

const api = createApi({
  // always needs a baseQuery
  baseQuery: fetchBaseQuery({
    baseUrl: "https://pokeapi.co/api/v2/",
  }),
  endpoints: (build) => ({
    // <WhatItReturns, ArgumentsItAccepts>
    pokemonList: build.query<PokemonListing, void>({
      // has to be queryFn()
      query() {
        return {
          // these are specific to `fetchBaseQuery`
          url: "pokemon", // essentially https://pokeapi.co/api/v2/pokemon cause of baseUrl
          params: { limit: 9 },
          // cleaner than 'pokemon?limit=9'
          // all the different arguments that you could also pass into the `fetch` "init" option
          // see https://developer.mozilla.org/en-US/docs/Web/API/fetch#parameters
          method: "GET", // GET is the default, this could be skipped
        };
      },
    }),
    // <WhatItReturns, ArgumentsItAccepts>
    pokemonDetail: build.query<PokemonDetailData, { name: string }>({
      query: ({ name }) => `pokemon/${name}/`, // essentially https://pokeapi.co/api/v2/pokemon/:name/ cause of baseUrl
    }),
  }),
});

const { usePokemonListQuery, usePokemonDetailQuery } = api;

const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  // boiler plate code I don't quite understand
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      {/* I think this proves you don't need redux to use rtk-query */}
      {/* <ApiProvider api={api}> */}
      <App />
      {/* </ApiProvider> */}
    </Provider>
  </React.StrictMode>
);

function App() {
  const [selectedPokemon, selectPokemon] = React.useState<string | undefined>(
    undefined
  );

  return (
    <>
      <header>
        <h1>My Pokedex</h1>
      </header>
      <main>
        {selectedPokemon ? (
          <>
            <PokemonDetails pokemonName={selectedPokemon} />
            <button onClick={() => selectPokemon(undefined)}>back</button>
          </>
        ) : (
          <PokemonList onPokemonSelected={selectPokemon} />
        )}
      </main>
    </>
  );
}

function PokemonList({
  onPokemonSelected,
}: {
  onPokemonSelected: (pokemonName: string) => void;
}) {
  const { isUninitialized, isLoading, isError, isSuccess, data } =
    usePokemonListQuery();

  if (isLoading || isUninitialized) {
    return <p>loading, please wait</p>;
  }

  if (isError) {
    return <p>something went wrong</p>;
  }

  return (
    <article>
      <h2>Overview</h2>
      <ol start={1}>
        {data.results.map((pokemon) => (
          <li key={pokemon.name}>
            <button onClick={() => onPokemonSelected(pokemon.name)}>
              {pokemon.name}
            </button>
          </li>
        ))}
      </ol>
    </article>
  );
}

const listFormatter = new Intl.ListFormat("en-GB", {
  style: "short",
  type: "conjunction",
});
function PokemonDetails({ pokemonName }: { pokemonName: string }) {
  const { isUninitialized, isLoading, isError, isSuccess, data } =
    usePokemonDetailQuery({
      name: pokemonName,
    });

  if (isLoading || isUninitialized) {
    return <p>loading, please wait</p>;
  }

  if (isError) {
    return <p>something went wrong</p>;
  }

  return (
    <article>
      <h2>{data.name}</h2>
      <img src={data.sprites.front_default} alt={data.name} />
      <ul>
        <li>id: {data.id}</li>
        <li>height: {data.height}</li>
        <li>weight: {data.weight}</li>
        <li>
          types:
          {listFormatter.format(data.types.map((item) => item.type.name))}
        </li>
      </ul>
    </article>
  );
}
