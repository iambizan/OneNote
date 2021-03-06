import { useEffect, useState } from "react";
//& firebase
import firebase from "./firebase/config";
import { db } from "./firebase/config";
//& components
import Sidebar from "./sidebar/Sidebar";
import Editor from "./editor/Editor";
//& logos
import google from "./icons/google.png";

const DashBoard = ({ auth }) => {
	//* states
	const [selectedNoteIndex, setSelectedNoteIndex] = useState(null);
	const [selectedNote, setSelectedNote] = useState(null);
	const [notes, setNotes] = useState([]);

	//*componentDidMount
	useEffect(() => {
		//* read
		const unsub = db
			.collection(`users/${auth.currentUser.uid}/notes`)
			.onSnapshot((serverUpdate) => {
				const notesTemp = serverUpdate.docs.map((_doc) => {
					const data = _doc.data();
					data["id"] = _doc.id;
					return data;
				});
				setNotes(notesTemp);
			});

		//*cleanup
		return () => {
			unsub();
		};
	}, []);

	const selectNote = (note, index) => {
		setSelectedNote(note);
		setSelectedNoteIndex(index);
	};

	//*create
	const newNote = async (title) => {
		const noteTemp = {
			title: title,
			body: "",
		};

		//&response from the firestore , the newly created note
		const res = await db
			.collection(`users/${auth.currentUser.uid}/notes`)
			.add({
				title: noteTemp.title,
				body: noteTemp.body,
				timestamp: firebase.firestore.FieldValue.serverTimestamp(),
			});

		const newId = res.id;
		noteTemp["id"] = newId;

		//& adding the new note in the list of notes
		await setNotes([...notes, noteTemp]);

		//TODO
		//& find the index of the new note
		const newNoteIndex = notes.indexOf(
			notes.filter((note) => note.id === newId)[0]
		);

		//& now setting the new note as the current note
		setSelectedNote(notes[newNoteIndex]);
		setSelectedNoteIndex(newNoteIndex);
	};

	//* update
	const noteUpdate = (id, noteObj) => {
		console.log("invoked update");
		db.collection(`users/${auth.currentUser.uid}/notes`).doc(id).update({
			title: noteObj.title,
			body: noteObj.body,
			timestamp: firebase.firestore.FieldValue.serverTimestamp(),
		});
	};

	//* delete
	//TODO : selected note DEBUG
	const deleteNote = async (note) => {
		//const noteIndex = notes.indexOf(note);

		//& deleting from the notes state
		await setNotes(notes.filter((noteTemp) => noteTemp !== note));

		selectNote(null, null);

		//& deleting from the firestore
		db.collection(`users/${auth.currentUser.uid}/notes`)
			.doc(note.id)
			.delete();

		// //& if we wanna delete the current selected noted
		// if (selectedNoteIndex === noteIndex) selectNote(null, null);
		// else {
		// 	if (notes.length > 1) {
		// 		//& since the length of notes will decrease , selected note's index will decrease
		// 		if (noteIndex > selectedNoteIndex)
		// 			selectNote(notes[selectedNoteIndex], selectedNoteIndex);
		// 		else
		// 			selectNote(notes[selectedNoteIndex - 1], selectedNoteIndex - 1);
		// 	} else {
		// 		selectNote(null, null);
		// 	}
		// }
	};

	return (
		<div className="dashboard-container">
			<Sidebar
				notes={notes}
				selectedNoteIndex={selectedNoteIndex}
				selectNote={selectNote}
				newNote={newNote}
				deleteNote={deleteNote}
			></Sidebar>
			{selectedNote ? (
				<Editor
					selectedNote={selectedNote}
					selectedNoteIndex={selectedNoteIndex}
					notes={notes}
					noteUpdate={noteUpdate}
				></Editor>
			) : null}
			<button onClick={() => auth.signOut()} className="signoutbtn">
				sign out with <img src={google} alt="google" />{" "}
			</button>
		</div>
	);
};

export default DashBoard;
