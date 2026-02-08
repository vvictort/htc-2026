
import './App.css'

function App() {

  return (
    <>
      <div className="flex flex-col gap-4 rounded-box bg-base-200 p-6 max-w-md">
        <h1 className="text-3xl font-bold self-center">Log in</h1>

        <span className="self-center">
            Don't have an account?
            <a className="link link-secondary">Register</a>
        </span>

        <a className="btn btn-neutral">
            <i className="fa-brands fa-google text-primary"></i>
            Log in with Google
        </a>

        <div className="divider">OR</div>

        <label className="form-control">
            <div className="label">
                <span className="label-text">Email</span>
            </div>

            <input className="input input-bordered" />
        </label>

        <label className="form-control">
            <div className="label">
                <span className="label-text">Password</span>
                <a className="label-text link link-accent">Forgot password?</a>
            </div>

            <input type="password" className="input input-bordered" />
        </label>

        <div className="form-control">
            <label className="cursor-pointer label self-start gap-2">
                <input type="checkbox" className="checkbox" />
                <span className="label-text">Remember me</span>
            </label>
        </div>

        <button className="btn btn-primary">Log in</button>
    </div>
    </>
  )
}

export default App
