import React, { use, useState } from "react";
import bg from "../images/bg_login.jpg";
import logo_tni_au from "../images/Lambang_TNI_AU.png";
// import logo_kpl from "../images/kaporlap_logo.png";
import axios from "axios";
import { useNavigate } from "react-router-dom";



export const Login = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        const data = new FormData(event.currentTarget);
        const username = data.get("username");
        const password = data.get("password");
        axios
            .post(`${process.env.REACT_APP_BACKEND}/login`, {
                username: username,
                password: password,
            })
            .then(async function (response) {
                if (response.data == "Wrong Password" || response.data == "Invalid username") {
                    console.log("Wrong Password");
                } else {
                    localStorage.setItem("username", response.data.username);
                    localStorage.setItem("id", response.data.id);
                    localStorage.setItem("token", response.data.token);

                    console.log(response.data);

                    if (response.data.role == "1") {
                        navigate("/dashboard");
                    }
                    // if (response.data.role == "2") {
                    //     navigate("/dstaflog");
                    // }
                }
            })
            .catch(async function (error) {
                console.log(username, password);
                console.log(error);
                setError("Gagal Melakukan Login");
                setTimeout(() => {
                    setError(null);
                }, 3000);
            });
    };


    return (
        <div
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                height: "100vh",
                width: "100vw",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: "60px",
                    borderRadius: "10px",
                    boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
                }}
            >
                <a href="#" class="d-flex justify-content-center mb-4">
                    <img src={logo_tni_au} alt="" width="100"></img>
                    {/* <img src={logo_kpl} alt="" width="100"></img> */}
                </a>

                <div class="text-center mb-3">
                    <h1 class="fw-bold pb-2" style={{ fontSize: 25 }}>Login</h1>
                    <p class="text-secondary">Seating Arrangement SETUMAU</p>
                </div>

                {error && (
                    <div class="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div class="mb-3">
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="bi bi-person"></i>
                            </span>
                            <input type="text" class="form-control form-control-lg fs-6" name="username" placeholder="Username" aria-describedby="emailHelp"></input>
                        </div>
                    </div>
                    <div class="input-group mb-3">
                        <span class="input-group-text">
                            <i class="bi bi-lock"></i>
                        </span>
                        <input type="password" class="form-control form-control-lg fs-6" name="password" placeholder="Password"></input>
                    </div>

                    <button class="btn btn-primary w-100">Submit</button>
                </form>
            </div>
        </div>
    );
};