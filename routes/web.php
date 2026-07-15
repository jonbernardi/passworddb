<?php

use App\Http\Controllers\DataController;
use App\Http\Controllers\SectionController;
use App\Http\Controllers\SiteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', [SiteController::class, 'index'])->name('home');
Route::post('/', [SiteController::class, 'create']);
Route::prefix('{site}')->whereNumber('site')->group(function () {
    Route::get('/', [SiteController::class, 'show'])->name('site');
    Route::patch('/', [SiteController::class, 'update']);
    Route::delete('/', [SiteController::class, 'destroy']);
    Route::prefix('section')->group(function () {
        Route::post('/', [SectionController::class, 'create']);
        Route::prefix('{section}')->whereNumber('section')->scopeBindings()->group(function () {
            Route::patch('/', [SectionController::class, 'update']);
            Route::delete('/', [SectionController::class, 'destroy']);
            Route::post('{dir}', [SectionController::class, 'move'])->where('dir', 'up|down');

            Route::prefix('data')->group(function () {
                Route::post('/', [DataController::class, 'create']);
                Route::prefix('{data}')->whereNumber('data')->scopeBindings()->group(function () {
                    Route::patch('/', [DataController::class, 'update']);
                    Route::delete('/', [DataController::class, 'destroy']);
                    Route::post('{dir}', [DataController::class, 'move'])->where('dir', 'left|right');
                });
            });
        });
    });
});
