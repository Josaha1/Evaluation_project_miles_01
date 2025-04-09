<?php
namespace App\Http\Controllers;

use Inertia\Inertia;

class HomeController extends Controller
{
    public function welcome()
    {
        return Inertia::render("Welcome");
    }
    public function dashboard()
    {
        return Inertia::render("Dashboard");
    }

    public function admindashboard()
    {
        return Inertia::render("Admindashboard");
    }

    public function adminquestionmanager()
    {
        return Inertia::render("AdminQuestionManager");
    }

    public function adminaspectmanager()
    {
        return Inertia::render("AdminAspectManager");
    }
}
