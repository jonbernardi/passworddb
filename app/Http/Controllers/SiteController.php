<?php

namespace App\Http\Controllers;

use App\Http\Requests\Site\AddSiteRequest;
use App\Http\Requests\Site\UpdateSiteRequest;
use App\Models\Site;
use Inertia\Inertia;

class SiteController extends Controller
{
    public function index()
    {
        $records = Site::select('id', 'name', 'domain', 'url')->orderBy('name')->get();

        return Inertia::render('Sites', compact('records'));
    }

    public function create(AddSiteRequest $request)
    {
        $site = Site::create($request->validated());

        return redirect()->route('site', $site);
    }

    public function show(Site $site)
    {
        $site->loadMissing('sections', 'sections.data');
        if (request()->wantsJson()) {
            return response()->json($site);
        }

        return Inertia::render('Site', compact('site'));
    }

    public function update(Site $site, UpdateSiteRequest $request)
    {
        $site->update($request->validated());

        return redirect()->route('site', $site);
    }

    public function destroy(Site $site)
    {
        $site->delete();

        return redirect()->route('home');
    }
}
