import React, { useEffect, useContext } from "react";
import { useHistory, useParams, Link } from "react-router-dom";
import Page from "./Page";
import Axios from "axios";
import LoadingDotsIcon from "./LoadingDotsIcon";
import { useImmerReducer } from "use-immer";
import StateContext from "../StateContext";
import DispatchContext from "../DispatchContext";
import NotFound from "./NotFound";

function EditPost() {
  const appState = useContext(StateContext);
  const appDispatch = useContext(DispatchContext);
  const history = useHistory();
  const postId = useParams().id;
  const initialState = {
    title: {
      value: "",
      hasErrors: false,
      message: ""
    },
    body: {
      value: "",
      hasErrors: false,
      message: ""
    },
    isFetching: true,
    isSaving: false,
    id: postId,
    sendCount: 0,
    postNotFound: false
  };

  function reducer(draft, action) {
    switch (action.type) {
      case "fetchComplete":
        draft.body.value = action.value.body;
        draft.title.value = action.value.title;
        draft.isFetching = false;
        return;
      case "titleChange":
        draft.title.value = action.value;
        draft.title.hasErrors = false;
        return;
      case "bodyChange":
        draft.body.value = action.value;
        draft.body.hasErrors = false;
        return;
      case "submitRequest":
        if (!draft.body.hasErrors && !draft.title.hasErrors) {
          draft.sendCount++;
        }
        return;
      case "saveRequestStarted":
        draft.isSaving = true;
        return;
      case "saveRequestFinished":
        draft.isSaving = false;
        return;
      case "titleRules":
        if (!action.value.trim()) {
          draft.title.hasErrors = true;
          draft.title.message = "you must provide a title";
        }
        return;
      case "bodyRules":
        if (!action.value.trim()) {
          draft.body.hasErrors = true;
          draft.body.message = "you must provide a body";
        }
        return;
      case "postNotFound":
        draft.postNotFound = true;
        return;
    }
  }

  const [state, dispatch] = useImmerReducer(reducer, initialState);
  function submitHandler(e) {
    e.preventDefault();
    dispatch({ type: "titleRules", value: state.title.value });
    dispatch({ type: "bodyRules", value: state.body.value });
    dispatch({ type: "submitRequest" });
  }
  function handleCancle(e) {
    e.preventDefault();

    history.push(`/post/${postId}`);
  }
  useEffect(() => {
    const ourRequest = Axios.CancelToken.source();
    async function fetchPost() {
      try {
        const response = await Axios.get(`/post/${state.id}`, { cancelToken: ourRequest.token });
        if (response.data) {
          dispatch({ type: "fetchComplete", value: response.data });
          if (appState.user.username !== response.data.author.username) {
            appDispatch({ type: "flashMessage", value: "you do not have permission to edit this post" });
            history.push(`/`);
          }
        } else {
          dispatch({ type: "postNotFound" });
        }
      } catch (e) {
        console.log("you get error");
      }
    }
    fetchPost();
    return () => {
      console.log("exited req");
      ourRequest.cancel();
    };
  }, []);

  useEffect(() => {
    if (state.sendCount) {
      dispatch({ type: "saveRequestStarted" });
      const ourRequest = Axios.CancelToken.source();
      async function fetchPost() {
        try {
          const response = await Axios.post(`/post/${state.id}/edit`, { title: state.title.value, body: state.body.value, token: appState.user.token }, { cancelToken: ourRequest.token });
          dispatch({ type: "saveRequestFinished" });
          appDispatch({ type: "flashMessage", value: "Successfully updated" });
          history.push(`/post/${postId}`);
          console.log("succes", response);
        } catch (e) {
          console.log("you get error");
        }
      }
      fetchPost();
      return () => {
        console.log("exited req");
        ourRequest.cancel();
      };
    }
  }, [state.sendCount]);

  if (state.postNotFound) return <NotFound />;
  if (state.isFetching) return <Page title="...">{<LoadingDotsIcon />}</Page>;

  return (
    <Page title="Create New Post">
      <form onSubmit={submitHandler}>
        <div className="form-group">
          <label htmlFor="post-title" className="text-muted mb-1">
            <small>Title</small>
          </label>
          <input
            onBlur={e => {
              dispatch({ type: "titleRules", value: e.target.value });
            }}
            onChange={e => dispatch({ type: "titleChange", value: e.target.value })}
            value={state.title.value}
            autoFocus
            name="title"
            id="post-title"
            className="form-control form-control-lg form-control-title"
            type="text"
            placeholder=""
            autoComplete="off"
          />

          {state.title.hasErrors && <div className="alert alert-danger small liveValidateMessage">{state.title.message}</div>}
        </div>
        <div className="form-group">
          <label htmlFor="post-body" className="text-muted mb-1 d-block">
            <small>Body Content</small>
          </label>
          <textarea onBlur={e => dispatch({ type: "bodyRules", value: e.target.value })} onChange={e => dispatch({ type: "bodyChange", value: e.target.value })} value={state.body.value} name="body" id="post-body" className="body-content tall-textarea form-control" type="text" />
          {state.body.hasErrors && <div className="alert alert-danger small liveValidateMessage">{state.body.message}</div>}
        </div>
        <button disabled={state.isSaving} className="btn btn-primary">
          Save Updates
        </button>{" "}
        <button onClick={handleCancle} className="btn btn-secondary">
          Cancel
        </button>
      </form>
    </Page>
  );
}

export default EditPost;
