import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardWithFooter } from "./pages/Dashboard";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<DashboardWithFooter />} />
			</Routes>
		</Router>
	);
}

export default App;
