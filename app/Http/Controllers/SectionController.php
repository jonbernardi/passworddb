<?php

namespace App\Http\Controllers;

use App\Http\Requests\Section\AddSectionRequest;
use App\Http\Requests\Section\UpdateSectionRequest;
use App\Models\Section;
use App\Models\Site;

class SectionController extends Controller
{
    public function create(Site $site, AddSectionRequest $request)
    {
        $section = new Section($request->only(['name']));
        $site->sections()->save($section);

        return redirect()->route('site', $site);
    }

    public function update(Site $site, Section $section, UpdateSectionRequest $request)
    {
        $section->update($request->only('name'));

        return redirect()->route('site', $site);
    }

    public function destroy(Site $site, Section $section)
    {
        $section->delete();
        $sections = $site->sections()->ordered()->pluck('id');
        Section::setNewOrder($sections);

        return redirect()->route('site', $site);
    }

    public function move(Site $site, Section $section, string $dir)
    {
        if ($dir === 'up') {
            $section->moveOrderUp();
        } else {
            $section->moveOrderDown();
        }

        return redirect()->route('site', $site);
    }
}
