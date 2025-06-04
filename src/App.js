import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { DashboardWithFooter } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { ViewerWithFooter } from "./pages/Viewer";

function App() {
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Login />} />
				<Route path="/dashboard" element={<DashboardWithFooter />} />
				<Route path="/viewer" element={<ViewerWithFooter />} />
			</Routes>
		</Router>
	);
}

export default App;
