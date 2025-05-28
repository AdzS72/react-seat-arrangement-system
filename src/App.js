import logo from "./logo.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardWithFooter } from "./pages/Dashboard";
import { Login } from "./pages/Login";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/dashboard" element={<DashboardWithFooter />} />
			</Routes>
		</Router>
	);
}

export default App;
