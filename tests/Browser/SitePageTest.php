<?php

namespace Tests\Browser;

use App\Models\Data;
use App\Models\Section;
use App\Models\Site;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;

class SitePageTest extends DuskTestCase
{
    use DatabaseMigrations;

    public function test_site_page()
    {
        $site = Site::factory()->create(['name' => 'first site']);
        $section = Section::factory()->create(['name' => 'first section', 'site_id' => $site->id]);
        $data = [
            'name' => 'first field',
            'value' => 'first value',
            'type' => 'text',
        ];
        $record = Data::factory()->create(['name' => 'first record', 'section_id' => $section->id, 'data' => [$data]]);

        $this->browse(function (Browser $browser) use ($data, $record, $section, $site) {
            $browser->visit("/{$site->id}")
                ->assertSee($site->name)
                ->assertSee($section->name)
                ->assertSee($record->name)
                ->assertSee($data['name'])
                ->assertSee($data['value']);
        });
    }
}
