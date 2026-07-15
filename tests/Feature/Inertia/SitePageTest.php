<?php

namespace Tests\Feature\Inertia;

use App\Models\Data;
use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class SitePageTest extends TestCase
{
    use RefreshDatabase;

    public function test_site_page_data()
    {
        $site = Site::factory()->create(['name' => 'first site']);
        $section = Section::factory()->create(['site_id' => $site, 'sort' => 0]);
        $section2 = Section::factory()->create(['site_id' => $site, 'sort' => 1]);
        $record = Data::factory()->create(['section_id' => $section, 'data' => [
            [
                'name' => 'username',
                'value' => 'Bob',
                'type' => 'text',
            ],
            [
                'name' => 'password',
                'value' => 'pa$$',
                'type' => 'text',
            ],
        ]]);

        $this->get("/{$site->id}")
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Site')
                ->has('site', fn (AssertableInertia $page) => $page
                    ->where('id', $site->id)
                    ->where('name', $site->name)
                    ->where('domain', $site->domain)
                    ->where('url', $site->url)
                    ->where('notes', $site->notes)
                    ->etc()
                    ->has('sections', 2)
                    ->has('sections.0', fn (AssertableInertia $page) => $page
                        ->where('id', $section->id)
                        ->where('name', $section->name)
                        ->etc()
                        ->has('data', 1)
                        ->has('data.0', fn (AssertableInertia $page) => $page
                            ->where('id', $record->id)
                            ->where('name', $record->name)
                            ->etc()
                            ->has('data', 2)
                            ->has('data.0', fn (AssertableInertia $page) => $page
                                ->where('name', 'username')
                                ->where('value', 'Bob')
                                ->where('type', 'text')
                                ->etc()
                            )
                            ->has('data.1', fn (AssertableInertia $page) => $page
                                ->where('name', 'password')
                                ->where('value', 'pa$$')
                                ->where('type', 'text')
                                ->etc()
                            )
                        )
                    )
                    ->has('sections.1', fn (AssertableInertia $page) => $page
                        ->where('id', $section2->id)
                        ->where('name', $section2->name)
                        ->has('data', 0)
                        ->etc()
                    )
                )
            );
    }
}
